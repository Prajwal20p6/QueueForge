import { Worker, Job, ConnectionOptions, Queue } from 'bullmq';
import { DeliverTaskResultUseCase } from '../../application/use-cases/DeliverTaskResultUseCase';
import { logger } from '../logging/logger';
import { metricsService } from '../monitoring/metrics.service';

export class BullMQWorker {
  private readonly worker: Worker;
  private readonly connectionOpts: ConnectionOptions;
  private metricsInterval?: NodeJS.Timeout;

  constructor(
    private readonly deliverUseCase: DeliverTaskResultUseCase,
    private readonly queue: Queue
  ) {
    this.connectionOpts = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    };

    // Bulkhead isolation: limit concurrency to prevent resource exhaustion
    this.worker = new Worker(
      'delivery-queue',
      async (job: Job) => {
        const { taskResultId, destinationId } = job.data;
        const attempt = job.attemptsMade + 1;
        const maxRetries = job.opts.attempts ?? 5;

        logger.info(
          `Worker running job ${job.id} for taskResult ${taskResultId} destination ${destinationId} (attempt: ${attempt}/${maxRetries})`
        );

        const startTime = Date.now();
        let status = 'success';

        try {
          await this.deliverUseCase.execute(taskResultId, destinationId, attempt, maxRetries);
          logger.info(`Job ${job.id} completed successfully`);
        } catch (error: any) {
          status = 'fail';
          logger.error(`Job ${job.id} failed attempt ${attempt}: ${error.message}`);
          throw error; // Let BullMQ capture failure and schedule retry/DLQ
        } finally {
          const durationSec = (Date.now() - startTime) / 1000;

          // Track metric counts
          metricsService.deliveryAttemptsTotal.inc({
            destination: destinationId,
            status,
            attempt: attempt.toString(),
          });

          // Track metric latency
          metricsService.deliveryDurationSeconds.observe(
            {
              destination: destinationId,
              status,
            },
            durationSec
          );
        }
      },
      {
        connection: this.connectionOpts,
        concurrency: 10, // Max concurrent jobs handled by this worker node
      }
    );

    this.worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed permanently (DLQ): ${err.message}`);
    });

    this.worker.on('error', err => {
      logger.error(`BullMQ worker connection/runtime error: ${err.message}`);
    });

    this.startQueueMonitoring();
    logger.info('BullMQ Worker started');
  }

  private startQueueMonitoring(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        const counts = await this.queue.getJobCounts(
          'active',
          'waiting',
          'delayed',
          'failed',
          'completed'
        );
        metricsService.queueSize.set({ queue: 'delivery-queue', status: 'active' }, counts.active);
        metricsService.queueSize.set(
          { queue: 'delivery-queue', status: 'waiting' },
          counts.waiting
        );
        metricsService.queueSize.set(
          { queue: 'delivery-queue', status: 'delayed' },
          counts.delayed
        );
        metricsService.queueSize.set({ queue: 'delivery-queue', status: 'failed' }, counts.failed);
        metricsService.queueSize.set(
          { queue: 'delivery-queue', status: 'completed' },
          counts.completed
        );
      } catch (err: any) {
        logger.error('Failed to get queue size metrics: ', err);
      }
    }, 5000);
  }

  public async close(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    await this.worker.close();
    logger.info('BullMQ Worker shutdown complete');
  }
}
