import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { QueueClient } from '../../../../src/infrastructure/queue/queue-client';
import { QueueConfig } from '../../../../src/config/queue.config';
import { Logger } from 'winston';
import { ValidationError } from '../../../../src/shared/errors/validation-error';

jest.mock('bullmq');
jest.mock('ioredis');

describe('queue-client Unit Tests', () => {
  let mockRedis: Redis;
  let config: QueueConfig;
  let logger: Logger;

  beforeEach(() => {
    mockRedis = {} as any;
    config = {
      mainQueueName: 'queue-main',
      delayedQueueName: 'queue-delayed',
      dlqQueueName: 'queue-dlq',
      concurrency: 5,
      defaultJobTimeout: 10000,
      staleInterval: 1000,
      lockDuration: 30000,
      lockRenewTime: 5000,
      retryBackoff: { type: 'exponential', delay: 1000 },
      maxBackoff: 5000,
      removeOnComplete: true,
      removeOnFail: false,
      defaultRepeatableKey: 'repeat',
      name: 'q',
      prefix: 'p',
      defaultJobOptions: {
        timeout: 10000,
        removeOnComplete: true,
        removeOnFail: false,
      },
      limiter: { max: 10, duration: 1000 },
      settings: {},
    };
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;
    jest.clearAllMocks();
  });

  it('should lazy load and cache queue instances', () => {
    const client = new QueueClient(mockRedis, config, logger);
    const q1 = client.getQueue('test-delivery-queue');
    const q2 = client.getQueue('test-delivery-queue');

    expect(q1).toBe(q2);
    expect(Queue).toHaveBeenCalledTimes(1);
  });

  it('should throw ValidationError on invalid queue name formatting', () => {
    const client = new QueueClient(mockRedis, config, logger);
    expect(() => client.getQueue('invalid_queue_name')).toThrow(ValidationError);
    expect(() => client.getQueue('invalid.name')).toThrow(ValidationError);
  });
});
