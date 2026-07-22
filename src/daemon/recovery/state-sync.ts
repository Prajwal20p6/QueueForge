import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { DeliveryRepository } from '../../infrastructure/repositories/delivery.repository';
import { Logger } from '../../observability/logging/logger';
import { MetricsRegistry } from '../../observability/metrics/metrics-registry';
import { DeliveryStatus } from '@prisma/client';

/**
 * Daemon reconciling database state with active BullMQ queues to resolve processing inconsistencies.
 */
export class StateSyncDaemon {
  private readonly repository: DeliveryRepository;
  private readonly queue: Queue;
  private readonly redis: Redis;
  private readonly logger: Logger;
  private readonly metrics: MetricsRegistry;
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private syncing = false;
  private readonly syncIntervalMs = 60000; // 60s

  constructor(
    deliveryRepository: DeliveryRepository,
    queue: Queue,
    redis: Redis,
    logger: Logger,
    metrics: MetricsRegistry
  ) {
    this.repository = deliveryRepository;
    this.queue = queue;
    this.redis = redis;
    this.logger = logger;
    this.metrics = metrics;
    this.logger.debug('StateSyncDaemon initialized', { hasRedis: !!this.redis });
  }

  /**
   * Starts the reconciliation loop.
   */
  public async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.logger.info('[StateSync] Starting state synchronization reconciler...');

    this.timer = setInterval(async () => {
      try {
        await this.sync();
      } catch (err: any) {
        this.logger.error('[StateSync] Sync cycle execution failure', err);
      }
    }, this.syncIntervalMs);
  }

  /**
   * Stops the synchronization run timer.
   */
  public async stop(): Promise<void> {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.logger.info('[StateSync] State synchronization reconciler stopped.');
  }

  /**
   * Checks if daemon is active.
   */
  public isRunning(): boolean {
    return this.running;
  }

  /**
   * Reconciles discrepancies between the database status records and the active BullMQ queue state.
   */
  public async sync(): Promise<{ synced: number; errors: number }> {
    if (this.syncing) return { synced: 0, errors: 0 };
    this.syncing = true;

    let synced = 0;
    let errors = 0;
    this.logger.debug('[StateSync] Running sync check...');

    try {
      // 1. Fetch PENDING deliveries from database
      const pendingRes = await this.repository.findMany({
        status: DeliveryStatus.PENDING,
      });
      const pendingDeliveries = pendingRes.data;

      // 2. Fetch all jobs in main queue (wait, active, delayed)
      const queueJobs = await this.queue.getJobs(['waiting', 'active', 'delayed', 'paused']);
      const queueJobIds = new Set(queueJobs.map((j) => j.id).filter(Boolean));

      // 3. Scan for DB pending items missing in main queue
      for (const delivery of pendingDeliveries) {
        const expectedJobId = `${delivery.taskResultId}:${delivery.destinationId}`;
        if (!queueJobIds.has(expectedJobId)) {
          try {
            await this.queue.add(
              expectedJobId,
              {
                taskResultId: delivery.taskResultId,
                destinationId: delivery.destinationId,
                attempt: delivery.retryCount,
              },
              {
                jobId: expectedJobId,
                attempts: 5,
                backoff: {
                  type: 'exponential',
                  delay: 2000,
                },
              }
            );
            synced++;
            this.logger.warn(`[StateSync] Re-enqueued missing PENDING job: ${expectedJobId}`);
          } catch (err: any) {
            errors++;
            this.logger.error(`[StateSync] Failed to re-enqueue missing job ${expectedJobId}`, err);
          }
        }
      }

      // 4. Scan for queue jobs referencing non-existent or soft-deleted DB deliveries
      for (const job of queueJobs) {
        if (!job.id) continue;
        const [taskResultId, destinationId] = job.id.split(':');
        if (!taskResultId || !destinationId) continue;

        try {
          const delivery = await this.repository.findOne({
            taskResultId,
            destinationId,
          });

          if (!delivery || delivery.deletedAt) {
            await job.remove();
            synced++;
            this.logger.warn(`[StateSync] Pruned orphaned queue job: ${job.id}`);
          }
        } catch (err: any) {
          errors++;
          this.logger.error(`[StateSync] Failed to check status for job ${job.id}`, err);
        }
      }

      // Record metrics
      const meter = this.metrics.getMeter();
      if (meter) {
        const cycleCounter = meter.createCounter('state_sync_cycles_total');
        cycleCounter.add(1);
        if (synced > 0) {
          const discrepancyCounter = meter.createCounter('state_sync_discrepancies_total');
          discrepancyCounter.add(synced);
        }
      }
    } catch (err: any) {
      errors++;
      this.logger.error('[StateSync] Synchronization loop execution failed', err);
    } finally {
      this.syncing = false;
    }

    return { synced, errors };
  }
}
export { Redis };
