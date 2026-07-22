import { Queue, ConnectionOptions } from 'bullmq';
import { IQueueService } from '../../application/interfaces/IQueueService';
import { logger } from '../logging/logger';

export class BullMQService implements IQueueService {
  private readonly queue: Queue;
  private readonly connectionOpts: ConnectionOptions;

  constructor() {
    this.connectionOpts = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    };

    this.queue = new Queue('delivery-queue', {
      connection: this.connectionOpts,
      defaultJobOptions: {
        removeOnComplete: true, // Keep clean redis space
        removeOnFail: false, // Do not delete failures immediately so they can be inspected
      },
    });

    logger.info('BullMQ Service initialized');
  }

  public async enqueueDelivery(
    taskResultId: string,
    destinationId: string,
    attempt: number = 1,
    delayMs?: number
  ): Promise<void> {
    const jobName = `${taskResultId}:${destinationId}`;

    // We add the job to the queue. Note that we configure BullMQ's native retries
    // here. The worker will call the use case, passing BullMQ's attempt number.
    await this.queue.add(
      jobName,
      {
        taskResultId,
        destinationId,
        attempt,
      },
      {
        // BullMQ automatic retry options:
        attempts: 5,
        delay: delayMs,
        backoff: {
          type: 'exponential',
          delay: 2000, // 2s, 4s, 8s, 16s, 32s (with built-in randomized jitter)
        },
      }
    );

    logger.debug(`Job ${jobName} enqueued successfully to delivery-queue with delay ${delayMs || 0}ms`);
  }

  public getQueueInstance(): Queue {
    return this.queue;
  }

  public async close(): Promise<void> {
    await this.queue.close();
    logger.info('BullMQ Queue closed');
  }
}
