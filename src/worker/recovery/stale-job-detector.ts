import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { DeliveryRepository } from '../../infrastructure/repositories/delivery.repository';
import { Logger } from '../../observability/logging/logger';
import { MetricsRegistry } from '../../observability/metrics/metrics-registry';
import { DeliveryStatus } from '@prisma/client';

/**
 * Detector scan loop identifying and recovering jobs left stuck in PROCESSING state due to worker crashes.
 */
export class StaleJobDetector {
  private readonly repository: DeliveryRepository;
  private readonly queue: Queue;
  private readonly logger: Logger;
  private readonly metrics: MetricsRegistry;
  private readonly staleTimeoutMs = 30000; // 30s stale lease threshold

  constructor(
    _redis: Redis,
    deliveryRepository: DeliveryRepository,
    queue: Queue,
    logger: Logger,
    metrics: MetricsRegistry
  ) {
    this.repository = deliveryRepository;
    this.queue = queue;
    this.logger = logger;
    this.metrics = metrics;
  }

  /**
   * Scans PostgreSQL for deliveries stuck in PROCESSING and recovers them.
   * @returns Total recovered jobs count
   */
  public async detectStale(): Promise<number> {
    const staleTime = new Date(Date.now() - this.staleTimeoutMs);
    this.logger.debug(`Scanning for stale deliveries updated before: ${staleTime.toISOString()}`);

    const res = await this.repository.findMany({
      status: DeliveryStatus.PROCESSING,
      updatedAt: {
        lte: staleTime,
      },
    });

    const staleDeliveries = res.data;
    const count = staleDeliveries.length;
    if (count > 0) {
      this.logger.warn(`Detected ${count} stale deliveries in PROCESSING state.`);
      // Record metrics
      const meter = this.metrics.getMeter();
      if (meter) {
        const counter = meter.createCounter('stale_jobs_detected_total');
        counter.add(count);
      }

      for (const delivery of staleDeliveries) {
        await this.recover(delivery.id);
      }
    }

    return count;
  }

  /**
   * Transitions a specific delivery back to PENDING.
   */
  public async markAsStale(deliveryId: string): Promise<void> {
    const auditCtx = {
      actorId: 'stale_job_detector',
      reason: 'Detected stale processing status lease expiration',
    };
    await this.repository.updateDeliveryStatus(deliveryId, DeliveryStatus.PENDING, undefined, auditCtx);
  }

  /**
   * Recovers a crashed processing delivery by marking it PENDING and re-enqueueing it.
   */
  public async recover(deliveryId: string): Promise<void> {
    this.logger.info(`Recovering stale delivery job: ${deliveryId}`);

    try {
      const delivery = await this.repository.findById(deliveryId);
      if (!delivery) {
        throw new Error(`Stale delivery ${deliveryId} not found in database`);
      }

      // 1. Re-enqueue to main BullMQ queue
      const jobName = `${delivery.taskResultId}:${delivery.destinationId}`;
      await this.queue.add(
        jobName,
        {
          taskResultId: delivery.taskResultId,
          destinationId: delivery.destinationId,
          attempt: delivery.retryCount,
        },
        {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );

      // 2. Mark as PENDING in DB
      await this.markAsStale(deliveryId);

      // Record metrics
      const meter = this.metrics.getMeter();
      if (meter) {
        const counter = meter.createCounter('stale_jobs_recovered_total');
        counter.add(1);
      }

      this.logger.info(`Stale delivery ${deliveryId} successfully re-enqueued.`);
    } catch (err: any) {
      this.logger.error(`Failed to recover stale delivery job: ${deliveryId}`, err);
    }
  }
}
export { Redis };
