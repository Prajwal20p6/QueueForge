import client from 'prom-client';
import { IDeliveryLogRepository as DeliveryRepository } from '../../domain/repositories/IDeliveryLogRepository';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';
import { DeliveryError } from '../../domain/value-objects/delivery-error.vo';
import { DeliveryNotFoundError } from '../errors/delivery-not-found-error';

// Dynamically register custom metrics if not already declared in registry
export const deliveryFailedCounter =
  (client.register.getSingleMetric('delivery_failed_total') as client.Counter) ||
  new client.Counter({
    name: 'delivery_failed_total',
    help: 'Total failed delivery attempts',
  });

export const deliveryDlqCounter =
  (client.register.getSingleMetric('delivery_moved_to_dlq_total') as client.Counter) ||
  new client.Counter({
    name: 'delivery_moved_to_dlq_total',
    help: 'Total deliveries moved to Dead Letter Queue (DLQ)',
  });

/**
 * Service managing failed delivery states, counting retries, and routing to DLQ pipelines.
 */
export class HandleFailureService {
  constructor(
    private readonly deliveryRepository: DeliveryRepository | any,
    private readonly logger?: Logger | any,
    _metrics?: any,
    private readonly eventPublisher?: any,
    private readonly attemptRepository?: any
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
   * Evaluates failed webhook calls, schedules backoffs, or directs task results to the DLQ.
   */
  public async handleFailure(
    deliveryId: string,
    error: DeliveryError | Error | any,
    statusCodeOrIsRetryable?: number | boolean
  ): Promise<void> {
    const delivery = await this.loadDelivery(deliveryId);

    const errorMessage = typeof error === 'string' ? error : (error?.message || 'Unknown delivery failure');
    const statusCode = typeof statusCodeOrIsRetryable === 'number'
      ? statusCodeOrIsRetryable
      : (error?.statusCode || error?.status || 500);

    const isRetryable = typeof statusCodeOrIsRetryable === 'boolean'
      ? statusCodeOrIsRetryable
      : (typeof error?.isRetryable === 'function' ? error.isRetryable() : (error?.isRetryable ?? (statusCode >= 500 || statusCode === 0 || statusCode === 429)));

    this.logger?.warn?.(`Handling failure for delivery "${deliveryId}": ${errorMessage} (Retryable: ${isRetryable})`);

    // Record failure attempt log if repo available
    if (this.attemptRepository && typeof this.attemptRepository.recordAttempt === 'function') {
      await this.attemptRepository.recordAttempt(deliveryId, {
        responseStatus: statusCode,
        errorMessage,
      });
    }

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

    if (typeof delivery.markFailed === 'function') {
      delivery.markFailed(error, isRetryable);
    }

    const maxRetries = 5;
    const canRetry = typeof delivery.canRetry === 'function' ? delivery.canRetry() : delivery.getRetryCount() < maxRetries;

    if (isRetryable && canRetry) {
      const delayMs = Math.pow(2, delivery.getRetryCount()) * 1000;

      if (typeof delivery.scheduleRetry === 'function') {
        delivery.scheduleRetry(delayMs);
      }

      if (typeof delivery.addDomainEvent === 'function') {
        delivery.addDomainEvent({
          name: 'DeliveryFailedEvent',
          aggregateId: deliveryId,
          timestamp: new Date(),
          deliveryId,
          errorMessage,
          isRetryable: true,
          retryCount: delivery.getRetryCount(),
        });
      }

      if (this.eventPublisher && typeof this.eventPublisher.publish === 'function') {
        await this.eventPublisher.publish('DeliveryFailedEvent', { deliveryId, errorMessage, retryCount: delivery.getRetryCount() });
      }

      deliveryFailedCounter.inc();
      this.logger?.info?.(`Scheduled retry attempt #${delivery.getRetryCount() + 1} for delivery "${deliveryId}" in ${delayMs}ms`);
    } else {
      // Move to DLQ permanently
      if (typeof delivery.moveToDeadLetterQueue === 'function') {
        delivery.moveToDeadLetterQueue(errorMessage);
      } else if (typeof delivery.moveToDLQ === 'function') {
        delivery.moveToDLQ(errorMessage);
      }

      if (typeof delivery.addDomainEvent === 'function') {
        delivery.addDomainEvent({
          name: 'DeliveryMovedToDLQEvent',
          aggregateId: deliveryId,
          timestamp: new Date(),
          deliveryId,
          finalErrorMessage: errorMessage,
          totalAttempts: delivery.getRetryCount(),
        });
      }

      if (this.eventPublisher && typeof this.eventPublisher.publish === 'function') {
        await this.eventPublisher.publish('DeliveryMovedToDLQEvent', { deliveryId, errorMessage });
      }

      deliveryDlqCounter.inc();
      this.logger?.error?.(`Delivery "${deliveryId}" has failed permanently. Moved to Dead Letter Queue (DLQ).`);
    }

    await this.deliveryRepository.save(delivery);
  }
}
