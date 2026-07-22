import { IDeliveryLogRepository as DeliveryRepository } from '../../domain/repositories/IDeliveryLogRepository';
import { PrismaDeliveryLogRepository } from '../../infrastructure/database/PrismaDeliveryLogRepository';
import { IQueueService as Queue } from '../../application/interfaces/IQueueService';
import { ResilienceConfig } from '../../config/resilience';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

/**
 * Scheduler registering delayed retry attempts to BullMQ and updating next_retry_at times in PostgreSQL.
 */
export class RetryScheduler {
  private readonly deliveryRepository: DeliveryRepository;

  constructor(
    private readonly queue: Queue,
    private readonly config: ResilienceConfig,
    private readonly logger: Logger,
    deliveryRepository?: DeliveryRepository
  ) {
    this.deliveryRepository = deliveryRepository || new PrismaDeliveryLogRepository();
  }

  /**
   * Reschedules a delivery job to BullMQ delayed queue with calculated delay, updating databases.
   */
  public async scheduleRetry(
    deliveryId: string,
    retryCount: number,
    delayMs = 5000
  ): Promise<void> {
    const maxRetries = this.config.maxRetries || 5;
    if (retryCount >= maxRetries) {
      throw new Error(`Maximum retry attempts reached (${maxRetries})`);
    }

    const deliveries = await this.deliveryRepository.findByTaskResultId(deliveryId);
    const delivery = deliveries.find(d => d.getId() === deliveryId) || deliveries[0];
    if (!delivery) {
      throw new Error(`Delivery with ID ${deliveryId} not found`);
    }

    const nextRetryAt = new Date(Date.now() + delayMs);

    // Update state to scheduled_retry
    if (delivery.getStatus().kind !== 'processing') {
      delivery.markProcessing();
    }
    delivery.scheduleRetry(nextRetryAt);
    await this.deliveryRepository.save(delivery);

    // Push job to delayed queue
    await this.queue.enqueueDelivery(
      delivery.getTaskResultId(),
      delivery.getDestinationId(),
      retryCount + 1,
      delayMs
    );

    this.logger.info(`[RetryScheduler] Rescheduled job "${deliveryId}" to delayed queue (Delay: ${delayMs}ms).`);
  }

  /**
   * Cancels scheduled retry states.
   */
  public async cancelRetry(deliveryId: string): Promise<void> {
    const deliveries = await this.deliveryRepository.findByTaskResultId(deliveryId);
    const delivery = deliveries.find(d => d.getId() === deliveryId) || deliveries[0];
    if (delivery) {
      if (
        delivery.getStatus().kind !== 'processing' &&
        delivery.getStatus().kind !== 'scheduled_retry'
      ) {
        delivery.markProcessing();
      }
      delivery.moveToDLQ('Retry cancelled by supervisor action');
      await this.deliveryRepository.save(delivery);
      this.logger.warn(`[RetryScheduler] Cancelled retry for delivery "${deliveryId}" (Status: FAILED_DLQ).`);
    }
  }
}
