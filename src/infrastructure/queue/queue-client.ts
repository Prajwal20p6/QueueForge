import { Queue, QueueOptions } from 'bullmq';
import Redis from 'ioredis';
import { Logger } from 'winston';
import { QueueConfig } from '../../config/queue.config';
import { ValidationError } from '../../shared/errors/validation-error';

/**
 * Lazy client factory creating and caching BullMQ Queue instances.
 */
export class QueueClient {
  private readonly queues = new Map<string, Queue>();

  constructor(
    private readonly redis: Redis,
    private readonly config: QueueConfig,
    private readonly logger: Logger
  ) {}

  /**
   * Retrieves a cached Queue instance, or creates it if not cached.
   */
  public getQueue(queueName: string): Queue {
    const sanitized = queueName.replace(/:/g, '-');
    let q = this.queues.get(sanitized);
    if (!q) {
      q = this.createQueue(sanitized);
    }
    return q;
  }

  /**
   * Instantiates and registers a new BullMQ Queue with standard default options.
   */
  public createQueue(name: string, options?: any): Queue {
    const sanitizedName = name.replace(/:/g, '-');
    // Validate queue name format (alphanumeric and hyphens only)
    const nameRegex = /^[a-zA-Z0-9\-]+$/;
    if (!nameRegex.test(sanitizedName)) {
      throw new ValidationError(`Invalid queue name format: "${name}". Valid format is alphanumeric and hyphens.`);
    }

    if (this.queues.has(sanitizedName)) {
      return this.queues.get(sanitizedName)!;
    }

    this.logger.info(`[QueueClient] Creating BullMQ queue: "${sanitizedName}"`);

    const defaultOpts: QueueOptions = {
      connection: this.redis,
      defaultJobOptions: {
        attempts: (this.config.defaultJobOptions as any)?.attempts || 3,
        removeOnComplete: this.config.defaultJobOptions?.removeOnComplete ?? true,
        removeOnFail: this.config.defaultJobOptions?.removeOnFail ?? false,
        timeout: this.config.defaultJobOptions?.timeout || 10000,
      } as any,
      ...options,
    };

    const queue = new Queue(sanitizedName, defaultOpts);
    this.queues.set(sanitizedName, queue);
    return queue;
  }

  /**
   * Closes and removes a managed Queue.
   */
  public async closeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      this.logger.info(`[QueueClient] Closing queue: "${queueName}"`);
      await queue.close();
      this.queues.delete(queueName);
    }
  }

  /**
   * Cleanly closes all active queues.
   */
  public async closeAllQueues(): Promise<void> {
    this.logger.info('[QueueClient] Closing all managed BullMQ queues...');
    const closePromises = Array.from(this.queues.values()).map((q) => q.close());
    await Promise.all(closePromises);
    this.queues.clear();
  }
}
