import { Queue, Job, JobsOptions } from 'bullmq';
import { Logger } from 'winston';
import { QueueClient } from './queue-client';
import { JobSerializer } from './job-serializer';
import { Repositories } from '../repositories';
import { ObservabilityContext } from '../../observability/types';
import { ValidationError } from '../../shared/errors/validation-error';
import { NotFoundError } from '../../shared/errors/not-found-error';
import { InfrastructureError } from '../../shared/errors/infrastructure-error';
import { ErrorCode } from '../../shared/constants/error-codes';
import { SpanFactory } from '../../observability/tracing/span-factory';
import client from 'prom-client';

const enqueueErrors = (client.register.getSingleMetric('queue_enqueue_errors_total') as client.Counter) || new client.Counter({
  name: 'queue_enqueue_errors_total',
  help: 'Total number of enqueue errors',
  labelNames: ['type'],
});

export interface JobData {
  deliveryId: string;
  payload: any;
  attempts?: number;
  [key: string]: any;
}

export interface QueueDepth {
  main: number;
  delayed: number;
  dlq: number;
}

export interface QueueStats {
  main: { active: number; waiting: number; delayed: number; failed: number; completed: number };
  delayed: { active: number; waiting: number; delayed: number; failed: number; completed: number };
  dlq: { active: number; waiting: number; delayed: number; failed: number; completed: number };
}

/**
 * Orchestrates job lifecycles across main, delayed, and dead-letter queues.
 */
export class QueueManager {
  private readonly mainQueue: Queue;
  private readonly delayedQueue: Queue;
  private readonly dlqQueue: Queue;

  constructor(
    private readonly queueClient: QueueClient,
    _repositories: Repositories,
    private readonly logger: Logger,
    private readonly observability: ObservabilityContext
  ) {
    // Resolve standard queue instances dynamically
    const config = (queueClient as any).config;
    this.mainQueue = this.queueClient.getQueue(config.mainQueueName || 'queueforge-main');
    this.delayedQueue = this.queueClient.getQueue(config.delayedQueueName || 'queueforge-delayed');
    this.dlqQueue = this.queueClient.getQueue(config.dlqQueueName || 'queueforge-dlq');
  }

  /**
   * Helper to locate a Job instance across the three managed queues.
   */
  private async findJob(jobId: string): Promise<{ job: Job; queue: Queue } | null> {
    const queues = [this.mainQueue, this.delayedQueue, this.dlqQueue];
    for (const q of queues) {
      const job = await Job.fromId(q, jobId);
      if (job) {
        return { job, queue: q };
      }
    }
    return null;
  }

  /**
   * Enqueues a job into the main processing queue.
   */
  public async enqueueJob(jobData: JobData, options?: JobsOptions): Promise<Job> {
    const spanFactory = new SpanFactory(this.observability.tracer.getTracer(), this.logger as any);
    const span = spanFactory.createSpan('QueueManager.enqueueJob', { deliveryId: jobData.deliveryId });
    try {
      JobSerializer.validateJobData(jobData);
      const serialized = JobSerializer.serialize(jobData);

      const job = await this.mainQueue.add(jobData.deliveryId, serialized, options);
      this.logger.info(`[QueueManager] Enqueued job: "${job.id}" in main queue.`);
      span.end();
      return job;
    } catch (err: any) {
      enqueueErrors.inc({ type: 'main' });
      span.recordException(err);
      span.end();
      if (err instanceof ValidationError) throw err;
      throw new InfrastructureError(`Failed to enqueue job: ${err.message}`, ErrorCode.UNKNOWN_ERROR);
    }
  }

  /**
   * Enqueues a job into the delayed queue scheduled to run after delayMs.
   */
  public async enqueueDelayedJob(jobData: JobData, delayMs: number, options?: JobsOptions): Promise<Job> {
    const spanFactory = new SpanFactory(this.observability.tracer.getTracer(), this.logger as any);
    const span = spanFactory.createSpan('QueueManager.enqueueDelayedJob', { deliveryId: jobData.deliveryId, delayMs });
    try {
      JobSerializer.validateJobData(jobData);
      const serialized = JobSerializer.serialize(jobData);

      const job = await this.delayedQueue.add(
        jobData.deliveryId,
        serialized,
        { ...options, delay: delayMs }
      );
      this.logger.info(`[QueueManager] Enqueued delayed job: "${job.id}" with delay of ${delayMs}ms.`);
      span.end();
      return job;
    } catch (err: any) {
      enqueueErrors.inc({ type: 'delayed' });
      span.recordException(err);
      span.end();
      if (err instanceof ValidationError) throw err;
      throw new InfrastructureError(`Failed to enqueue delayed job: ${err.message}`, ErrorCode.UNKNOWN_ERROR);
    }
  }

  /**
   * Retrieves a job by ID.
   */
  public async getJob(jobId: string): Promise<Job | undefined> {
    const match = await this.findJob(jobId);
    return match?.job;
  }

  /**
   * Retrieves progress percentage of a job.
   */
  public async getJobProgress(jobId: string): Promise<number> {
    const match = await this.findJob(jobId);
    if (!match) {
      throw new NotFoundError(`Job not found with id: ${jobId}`);
    }
    return Number(match.job.progress);
  }

  /**
   * Cancels (removes) a job.
   */
  public async cancelJob(jobId: string): Promise<void> {
    const match = await this.findJob(jobId);
    if (!match) {
      throw new NotFoundError(`Job not found with id: ${jobId}`);
    }
    await match.job.remove();
    this.logger.info(`[QueueManager] Cancelled job: "${jobId}"`);
  }

  /**
   * Retries a failed job.
   */
  public async retryJob(jobId: string): Promise<void> {
    const match = await this.findJob(jobId);
    if (!match) {
      throw new NotFoundError(`Job not found with id: ${jobId}`);
    }
    await match.job.retry();
    this.logger.info(`[QueueManager] Triggered retry for job: "${jobId}"`);
  }

  /**
   * Moves a job to delayed state with delayMs.
   */
  public async moveToDelayed(jobId: string, delayMs: number): Promise<void> {
    const match = await this.findJob(jobId);
    if (!match) {
      throw new NotFoundError(`Job not found with id: ${jobId}`);
    }
    const data = JobSerializer.deserialize(match.job.data);
    await match.job.remove();
    await this.enqueueDelayedJob(data, delayMs);
    this.logger.info(`[QueueManager] Moved job: "${jobId}" to delayed queue with ${delayMs}ms delay.`);
  }

  /**
   * Moves a job to DLQ (Dead Letter Queue).
   */
  public async moveToDLQ(jobId: string, reason: string): Promise<void> {
    const match = await this.findJob(jobId);
    if (!match) {
      throw new NotFoundError(`Job not found with id: ${jobId}`);
    }
    const data = JobSerializer.deserialize(match.job.data);
    await match.job.remove();
    await this.dlqQueue.add(data.deliveryId, {
      ...JobSerializer.serialize(data),
      dlqReason: reason,
      dlqAt: new Date().toISOString(),
    });
    this.logger.warn(`[QueueManager] Job: "${jobId}" moved to DLQ. Reason: ${reason}`);
  }

  /**
   * Counts currently pending/delayed/dead-letter jobs.
   */
  public async getQueueDepth(): Promise<QueueDepth> {
    const mainCounts = await this.mainQueue.getJobCounts();
    const delayedCounts = await this.delayedQueue.getJobCounts();
    const dlqCounts = await this.dlqQueue.getJobCounts();

    return {
      main: (mainCounts.active || 0) + (mainCounts.waiting || 0),
      delayed: delayedCounts.delayed || 0,
      dlq: (dlqCounts.failed || 0) + (dlqCounts.waiting || 0),
    };
  }

  /**
   * Gathers job stats for all queues.
   */
  public async getQueueStats(): Promise<QueueStats> {
    const main = await this.mainQueue.getJobCounts() as any;
    const delayed = await this.delayedQueue.getJobCounts() as any;
    const dlq = await this.dlqQueue.getJobCounts() as any;

    return { main, delayed, dlq };
  }

  /**
   * Pauses all processing queues.
   */
  public async pauseQueue(): Promise<void> {
    await this.mainQueue.pause();
    await this.delayedQueue.pause();
    await this.dlqQueue.pause();
    this.logger.info('[QueueManager] All processing queues paused.');
  }

  /**
   * Resumes all processing queues.
   */
  public async resumeQueue(): Promise<void> {
    await this.mainQueue.resume();
    await this.delayedQueue.resume();
    await this.dlqQueue.resume();
    this.logger.info('[QueueManager] All processing queues resumed.');
  }

  /**
   * Drains and clears a targeted queue.
   */
  public async clearQueue(queueName: string): Promise<void> {
    this.logger.warn(`[QueueManager] DRAINING QUEUE: "${queueName}"! All uncompleted jobs will be deleted.`);
    const q = this.queueClient.getQueue(queueName);
    await q.drain();
  }
}
