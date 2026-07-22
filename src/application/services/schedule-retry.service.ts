import { IDeliveryLogRepository as DeliveryRepository } from '../../domain/repositories/IDeliveryLogRepository';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';
import { MaxRetriesExceededError } from '../../domain/errors/max-retries-exceeded-error';
import { DeliveryNotFoundError } from '../errors/delivery-not-found-error';

export class ScheduleRetryService {
  constructor(
    private readonly deliveryRepository: DeliveryRepository | any,
    private readonly queue: any,
    private readonly logger?: Logger | any
  ) {}

  private async loadDelivery(deliveryId: string): Promise<any> {
    if (this.deliveryRepository?.findById) {
      const found = await this.deliveryRepository.findById(deliveryId);
      if (found) return found;
    }

    if (this.deliveryRepository?.findByTaskResultId) {
      const deliveries = await this.deliveryRepository.findByTaskResultId(deliveryId);
      const delivery = (deliveries || []).find((d: any) => d.getId?.() === deliveryId) || deliveries?.[0];
      if (delivery) return delivery;
    }

    throw new DeliveryNotFoundError(deliveryId);
  }

  /**
   * Schedules a delayed retry job for a delivery in BullMQ.
   */
  public async scheduleRetry(
    deliveryId: string,
    retryCountOrStrategy?: any,
    maxRetriesOrStrategy?: any
  ): Promise<void> {
    const delivery = await this.loadDelivery(deliveryId);

    const currentRetryCount = delivery.getRetryCount();
    const maxAllowed = typeof maxRetriesOrStrategy === 'number'
      ? maxRetriesOrStrategy
      : (maxRetriesOrStrategy?.maxRetries ?? maxRetriesOrStrategy?.getMaxRetries?.() ?? 5);

    if (currentRetryCount >= maxAllowed) {
      delivery.moveToDeadLetterQueue?.(`Max retries exceeded (${currentRetryCount}/${maxAllowed})`);
      await this.deliveryRepository.save(delivery);
      throw new MaxRetriesExceededError(deliveryId, currentRetryCount, maxAllowed);
    }

    const attemptNum = typeof retryCountOrStrategy === 'number' && retryCountOrStrategy < 100 ? retryCountOrStrategy : currentRetryCount;

    const strategy = typeof maxRetriesOrStrategy === 'object' && maxRetriesOrStrategy !== null
      ? maxRetriesOrStrategy
      : (typeof retryCountOrStrategy === 'object' && retryCountOrStrategy !== null ? retryCountOrStrategy : null);

    const delay = (strategy && typeof strategy.calculateDelay === 'function')
      ? strategy.calculateDelay(attemptNum + 1)
      : (typeof retryCountOrStrategy === 'number' && retryCountOrStrategy >= 100 ? retryCountOrStrategy : 1000 * Math.pow(2, attemptNum));

    const statusObj = typeof delivery.getStatus === 'function' ? delivery.getStatus() : delivery.status;
    const rawStatusStr = typeof statusObj === 'object' && statusObj !== null
      ? (statusObj.kind || statusObj.value || (typeof statusObj.getValue === 'function' ? statusObj.getValue() : String(statusObj)))
      : String(statusObj || '');

    const statusUpper = String(rawStatusStr).toUpperCase();

    if (statusUpper === 'PENDING' || statusUpper === 'SCHEDULED_RETRY' || statusUpper === 'SCHEDULEDRETRY') {
      if (typeof delivery.markAsProcessing === 'function') {
        delivery.markAsProcessing();
      } else if (typeof delivery.markProcessing === 'function') {
        delivery.markProcessing();
      }
    }

    delivery.scheduleRetry?.(delay);
    await this.deliveryRepository.save(delivery);

    if (this.queue) {
      if (typeof this.queue.enqueueDelivery === 'function') {
        await this.queue.enqueueDelivery(
          delivery.getTaskResultId(),
          delivery.getDestinationId(),
          attemptNum + 1,
          delay
        );
      } else if (typeof this.queue.add === 'function') {
        await this.queue.add(
          'deliver-task-result',
          { deliveryId },
          {
            delay,
            attempts: 5,
            jobId: `retry:${deliveryId}:${attemptNum + 1}`,
          }
        );
      }
    }

    this.logger?.info?.(`Scheduled retry #${attemptNum + 1} for delivery ${deliveryId} in ${delay}ms`);
  }
}
