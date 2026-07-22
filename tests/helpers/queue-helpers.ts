import { Queue, Job, JobState } from 'bullmq';
import { sleep } from '../utils/test-utils';

/** BullMQ job status types exposed by QueueTestHelper. */
export type JobStatus = JobState | 'unknown';

/**
 * Provides utilities to inspect, drain, and simulate BullMQ queue operations during tests.
 *
 * @example
 * ```typescript
 * const qh = new QueueTestHelper(queue);
 * await qh.drainQueue();
 * const jobs = await qh.getJobs('waiting');
 * ```
 */
export class QueueTestHelper {
  private readonly queue: Queue;

  constructor(queue: Queue) {
    this.queue = queue;
  }

  /**
   * Removes all jobs from every queue state: waiting, active, delayed, failed, completed.
   */
  public async cleanup(): Promise<void> {
    await this.queue.obliterate({ force: true });
  }

  /**
   * Returns all jobs matching an optional status filter.
   * @param status - Optional BullMQ job state to filter by.
   */
  public async getJobs(status?: JobStatus): Promise<Job[]> {
    if (!status) {
      const [waiting, active, delayed, failed, completed] = await Promise.all([
        this.queue.getWaiting(),
        this.queue.getActive(),
        this.queue.getDelayed(),
        this.queue.getFailed(),
        this.queue.getCompleted(),
      ]);
      return [...waiting, ...active, ...delayed, ...failed, ...completed];
    }

    switch (status) {
      case 'waiting':   return this.queue.getWaiting();
      case 'active':    return this.queue.getActive();
      case 'delayed':   return this.queue.getDelayed();
      case 'failed':    return this.queue.getFailed();
      case 'completed': return this.queue.getCompleted();
      default:          return [];
    }
  }

  /**
   * Returns the total number of jobs across all states.
   */
  public async getJobCount(): Promise<number> {
    const counts = await this.queue.getJobCounts(
      'waiting', 'active', 'delayed', 'failed', 'completed', 'paused'
    );
    return Object.values(counts).reduce((sum, n) => sum + n, 0);
  }

  /**
   * Polls until a job with the given ID reaches a terminal state (completed or failed).
   * @param jobId - Target BullMQ job ID.
   * @param timeoutMs - Maximum wait time in milliseconds (default: 10000).
   * @throws {Error} if the job is not found or does not complete within the timeout.
   */
  public async waitForJob(jobId: string, timeoutMs = 10000): Promise<Job> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        await sleep(100);
        continue;
      }

      const state = await job.getState();
      if (state === 'completed' || state === 'failed') {
        return job;
      }

      await sleep(100);
    }

    throw new Error(
      `[QueueTestHelper] Job "${jobId}" did not reach terminal state within ${timeoutMs}ms.`
    );
  }

  /**
   * Drains the queue — removes all waiting and delayed jobs without processing them.
   */
  public async drainQueue(): Promise<void> {
    await this.queue.drain(true);
  }

  /**
   * Simulates successful job completion by moving it to the completed set.
   * @param jobId - Target BullMQ job ID.
   */
  public async simulateJobCompletion(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      throw new Error(`[QueueTestHelper] Job "${jobId}" not found.`);
    }
    await job.moveToCompleted({ success: true }, 'test-token', false);
  }

  /**
   * Simulates a failed job by moving it to the failed set.
   * @param jobId - Target BullMQ job ID.
   * @param error - Error to associate with the failure.
   */
  public async simulateJobFailure(jobId: string, error: Error): Promise<void> {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      throw new Error(`[QueueTestHelper] Job "${jobId}" not found.`);
    }
    await job.moveToFailed(error, 'test-token', false);
  }

  /**
   * Returns the underlying BullMQ Queue instance.
   */
  public getQueue(): Queue {
    return this.queue;
  }
}
