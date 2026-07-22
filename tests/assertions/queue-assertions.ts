import { Queue } from 'bullmq';

/**
 * Queue assertions helper.
 */
export class QueueAssertions {
  public static async assertQueueEmpty(queue: Queue): Promise<void> {
    const count = await queue.getJobCount();
    if (count !== 0) {
      throw new Error(`Expected queue "${queue.name}" to be empty, but has ${count} jobs.`);
    }
  }

  public static async assertQueueHasJobs(queue: Queue, expectedCount: number): Promise<void> {
    const count = await queue.getJobCount();
    if (count !== expectedCount) {
      throw new Error(`Expected queue "${queue.name}" to have ${expectedCount} jobs, got ${count}.`);
    }
  }
}
