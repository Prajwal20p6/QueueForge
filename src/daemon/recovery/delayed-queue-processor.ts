import { Queue } from 'bullmq';
import { DeliveryRepository } from '../../infrastructure/repositories/delivery.repository';
import { Logger } from '../../observability/logging/logger';
import { MetricsRegistry } from '../../observability/metrics/metrics-registry';
import { Tracer } from '../../observability/tracing/tracer';
import { DeliveryStatus } from '@prisma/client';

/**
 * Daemon scanning PostgreSQL for deliveries stuck in SCHEDULED_RETRY state and dispatching them.
 */
export class DelayedQueueProcessor {
  private readonly queue: Queue;
  private readonly repository: DeliveryRepository;
  private readonly logger: Logger;
  private readonly metrics: MetricsRegistry;
  private readonly tracer: Tracer;
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private processing = false;
  private readonly pollIntervalMs = 10000; // 10s

  constructor(
    queue: Queue,
    deliveryRepository: DeliveryRepository,
    logger: Logger,
    metrics: MetricsRegistry,
    tracer: Tracer
  ) {
    this.queue = queue;
    this.repository = deliveryRepository;
    this.logger = logger;
    this.metrics = metrics;
    this.tracer = tracer;
  }

  /**
   * Starts the polling schedule.
   */
  public async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.logger.info('[DelayedQueueProcessor] Starting delayed queue polling daemon...');

    this.timer = setInterval(async () => {
      try {
        await this.processScheduledRetries();
      } catch (err: any) {
        this.logger.error('[DelayedQueueProcessor] Error during scheduled retries loop', err);
      }
    }, this.pollIntervalMs);
  }

  /**
   * Stops the polling schedule.
   */
  public async stop(): Promise<void> {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.logger.info('[DelayedQueueProcessor] Delayed queue polling daemon stopped.');
  }

  /**
   * Checks if daemon is active.
   */
  public isRunning(): boolean {
    return this.running;
  }

  /**
   * Fetches overdue retry jobs, marks them PENDING, and enqueues to main queue.
   */
  public async processScheduledRetries(): Promise<number> {
    if (this.processing) return 0;
    this.processing = true;

    const otelTracer = typeof (this.tracer as any)?.getTracer === 'function' ? (this.tracer as any).getTracer() : this.tracer;
    const span = otelTracer && typeof otelTracer.startSpan === 'function' ? otelTracer.startSpan('delayed.queue.processor.process') : null;
    let count = 0;

    try {
      const now = new Date();
      // Fetch deliveries in SCHEDULED_RETRY status overdue
      const overdueRes = await this.repository.findMany({
        status: DeliveryStatus.SCHEDULED_RETRY,
        nextRetryAt: {
          lte: now,
        },
      });

      const overdueDeliveries = overdueRes.data;
      count = overdueDeliveries.length;

      if (count > 0) {
        this.logger.info(`[DelayedQueueProcessor] Found ${count} overdue retry jobs. Processing transitions...`);

        for (const delivery of overdueDeliveries) {
          const auditCtx = {
            actorId: 'delayed_queue_processor',
            reason: 'Scheduled backoff retry timeout elapsed',
          };

          // 1. Move delivery back to PENDING in Postgres
          await this.repository.updateDeliveryStatus(
            delivery.id,
            DeliveryStatus.PENDING,
            undefined,
            auditCtx
          );

          // 2. Re-enqueue into BullMQ main queue
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

          this.logger.debug(
            `[DelayedQueueProcessor] Enqueued retry job for result ${delivery.taskResultId} to main queue.`
          );
        }

        // Telemetry update
        const meter = this.metrics.getMeter();
        if (meter) {
          const counter = meter.createCounter('scheduled_retries_processed_total');
          counter.add(count);
        }
      }
    } catch (err: any) {
      span.recordException(err);
      this.logger.error('[DelayedQueueProcessor] Failed to execute retry scheduling run', err);
    } finally {
      span.end();
      this.processing = false;
    }

    return count;
  }
}
