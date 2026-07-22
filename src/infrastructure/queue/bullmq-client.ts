import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { QueueClient } from './queue-client';

/**
 * Compatibility bridge implementing the integration test expectations of the QueueManager client.
 */
export class QueueManager {
  private client: QueueClient;
  private config: any;

  constructor(redis: Redis, config: any) {
    this.config = config;
    const normConfig = {
      mainQueueName: config.mainQueueName || 'queue:main',
      delayedQueueName: config.delayedQueueName || 'queue:delayed',
      dlqQueueName: config.dlqQueueName || 'queue:dlq',
      defaultJobOptions: config.settings?.defaultJobOptions || {
        attempts: 3,
        timeout: 10000,
        removeOnComplete: true,
        removeOnFail: false,
      },
    };
    this.client = new QueueClient(redis, normConfig as any, console as any);
  }

  /**
   * Pre-creates and warms up queues.
   */
  public async initializeQueues(): Promise<void> {
    const mainName = this.config.mainQueueName || 'queue:main';
    const delayedName = this.config.delayedQueueName || 'queue:delayed';
    const dlqName = this.config.dlqQueueName || 'queue:dlq';

    this.client.createQueue(mainName);
    this.client.createQueue(delayedName);
    this.client.createQueue(dlqName);
  }

  /**
   * Retrieves main queue instance.
   */
  public getMainQueue(): Queue {
    const name = this.config.mainQueueName || 'queue:main';
    return this.client.getQueue(name);
  }

  /**
   * Retrieves delayed queue instance.
   */
  public getDelayedQueue(): Queue {
    const name = this.config.delayedQueueName || 'queue:delayed';
    return this.client.getQueue(name);
  }

  /**
   * Retrieves DLQ queue instance.
   */
  public getDLQ(): Queue {
    const name = this.config.dlqQueueName || 'queue:dlq';
    return this.client.getQueue(name);
  }

  /**
   * Shuts down all connection queues.
   */
  public async disconnect(): Promise<void> {
    await this.client.closeAllQueues();
  }

  /**
   * Gathers job metrics.
   */
  public async getQueueStats(queueName: string): Promise<{ count: number }> {
    const q = this.client.getQueue(queueName);
    const counts = await q.getJobCounts();
    const count =
      (counts.active || 0) +
      (counts.waiting || 0) +
      (counts.delayed || 0) +
      (counts.failed || 0) +
      (counts.completed || 0);
    return { count };
  }
}
