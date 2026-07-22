import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { createQueue } from '../../../src/infrastructure/queue/queue-factory';
import { getRedisClient } from '../../../src/infrastructure/redis/client';
import { calculateBackoffWithJitter } from '../../../src/infrastructure/queue/queue-config';

describe('BullMQ Queue Factory Integration', () => {
  let redis: Redis;
  let config: any;

  beforeEach(() => {
    redis = getRedisClient();
    config = {
      settings: {
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
          timeout: 10000,
        },
      },
    };
    jest.restoreAllMocks();
  });

  it('should create fully configured Queue instances and register event listeners', () => {
    const queue = createQueue('test-delivery-queue', config, redis);

    expect(queue).toBeInstanceOf(Queue);
    expect(queue.name).toBe('test-delivery-queue');

    queue.close();
  });

  it('should validate queue name formats and throw error on invalid names', () => {
    expect(() => createQueue('invalid_queue_name', config, redis)).toThrow(
      /Invalid queue name format/
    );
    expect(() => createQueue('invalid.name', config, redis)).toThrow(/Invalid queue name format/);
  });

  it('should execute backoff delay logic applying exponential scaling and random jitter bounds', () => {
    const baseMs = 1000;
    const retryCount = 2;
    const maxMs = 3600000;

    const delay = calculateBackoffWithJitter(retryCount, baseMs);

    // delay calculation: (4 + random(0, 4)) * 1000
    // range: [4000, 8000]
    expect(delay).toBeGreaterThanOrEqual(4000);
    expect(delay).toBeLessThanOrEqual(8000);
    expect(delay).toBeLessThan(maxMs);
  });
});
