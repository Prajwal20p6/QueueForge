import { Queue } from 'bullmq';

/**
 * Utility for draining BullMQ test queues.
 */
export class QueueCleaner {
  constructor(private readonly queue: Queue) {}

  public async clearQueue(): Promise<void> {
    try {
      await this.queue.drain();
      await this.queue.clean(0, 100, 'completed');
      await this.queue.clean(0, 100, 'failed');
    } catch {
      // Ignore
    }
  }
}
