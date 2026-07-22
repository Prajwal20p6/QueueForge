import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { QueueManager } from '../../../src/infrastructure/queue/bullmq-client';
import { getRedisClient } from '../../../src/infrastructure/redis/client';

describe('BullMQ Queue Manager Client Integration', () => {
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

  it('should initialize queues, retrieve queues and close them cleanly', async () => {
    jest.spyOn(redis, 'ping').mockResolvedValue('PONG');

    const manager = new QueueManager(redis, config);
    await manager.initializeQueues();

    const mainQ = manager.getMainQueue();
    const delayedQ = manager.getDelayedQueue();
    const dlq = manager.getDLQ();

    expect(mainQ).toBeInstanceOf(Queue);
    expect(delayedQ).toBeInstanceOf(Queue);
    expect(dlq).toBeInstanceOf(Queue);

    await manager.disconnect();
  });

  it('should retrieve statistics of a managed queue', async () => {
    jest.spyOn(redis, 'ping').mockResolvedValue('PONG');

    const manager = new QueueManager(redis, config);
    await manager.initializeQueues();

    // Mock job counts
    jest.spyOn(manager.getMainQueue(), 'getJobCounts').mockResolvedValue({
      active: 1,
      waiting: 2,
      delayed: 0,
      failed: 0,
      completed: 3,
    } as any);

    const stats = await manager.getQueueStats('queue:main');
    expect(stats.count).toBe(6);

    await manager.disconnect();
  });
});
