import { Queue, Job } from 'bullmq';

/**
 * Fixture generator populating jobs into BullMQ queues.
 */
export class QueueFixtures {
  constructor(private readonly queue: Queue) {}

  public async addSampleJob(name = 'process-delivery', data: any = {}): Promise<Job> {
    return this.queue.add(name, data);
  }
}
