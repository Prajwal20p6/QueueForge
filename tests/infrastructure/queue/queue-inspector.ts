import { Queue, Job } from 'bullmq';

/**
 * Inspector querying queue states and job counts.
 */
export class QueueInspector {
  constructor(private readonly queue: Queue) {}

  public async getJobCount(): Promise<number> {
    try {
      return await this.queue.getJobCount();
    } catch {
      return 0;
    }
  }

  public async getJob(jobId: string): Promise<Job | undefined> {
    try {
      return await this.queue.getJob(jobId);
    } catch {
      return undefined;
    }
  }
}
