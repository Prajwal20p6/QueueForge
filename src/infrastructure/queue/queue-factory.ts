import { Queue, QueueOptions } from 'bullmq';
import Redis from 'ioredis';
import { QueueClient } from './queue-client';
import { QueueConfig } from '../../config/queue.config';
import { ValidationError } from '../../shared/errors/validation-error';

/**
 * Compatibility bridge creating customized Queue configurations for integration tests.
 */
export function createQueue(name: string, config: any, redis: Redis): Queue {
  const nameRegex = /^[a-zA-Z0-9\-:]+$/;
  if (!nameRegex.test(name)) {
    throw new ValidationError(`Invalid queue name format: "${name}". Valid format is alphanumeric, hyphens, and colons.`);
  }

  const defaultOpts: QueueOptions = {
    connection: redis,
    defaultJobOptions: {
      attempts: config.settings?.defaultJobOptions?.attempts || 3,
      removeOnComplete: config.settings?.defaultJobOptions?.removeOnComplete ?? true,
      removeOnFail: config.settings?.defaultJobOptions?.removeOnFail ?? false,
      timeout: config.settings?.defaultJobOptions?.timeout || 10000,
    } as any,
  };
  return new Queue(name, defaultOpts);
}

/**
 * Factory class generating typed BullMQ queues (Main, Delayed, and Dead Letter Queues).
 */
export class QueueFactory {
  /**
   * Generates the main task execution queue.
   */
  public static createMainQueue(client: QueueClient, config: QueueConfig): Queue {
    return client.createQueue(config.mainQueueName || 'queueforge-main', {
      defaultJobOptions: {
        attempts: (config.defaultJobOptions as any)?.attempts || 3,
        removeOnComplete: config.removeOnComplete ?? true,
        removeOnFail: config.removeOnFail ?? false,
        timeout: config.defaultJobTimeout || 30000,
      } as any,
    });
  }

  /**
   * Generates the delayed/scheduled retry queue.
   */
  public static createDelayedQueue(client: QueueClient, config: QueueConfig): Queue {
    return client.createQueue(config.delayedQueueName || 'queueforge-delayed', {
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: true,
      } as any,
    });
  }

  /**
   * Generates the dead-letter routing queue.
   */
  public static createDLQQueue(client: QueueClient, config: QueueConfig): Queue {
    return client.createQueue(config.dlqQueueName || 'queueforge-dlq', {
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: false,
        removeOnFail: false,
      } as any,
    });
  }
}
