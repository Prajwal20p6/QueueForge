import Redis from 'ioredis';
import { BulkheadManager } from '../../../src/resilience/bulkhead';

import { logger } from '../../../src/infrastructure/logging/logger';
import { PoolExhaustedError } from '../../../src/resilience/types';

describe('Bulkhead Integration Tests', () => {
  let redis: Redis;
  let manager: BulkheadManager;

  const config: any = {
    circuitBreakerEnabled: true,
    circuitBreakerThreshold: 50,
    circuitBreakerTimeout: 60,
    circuitBreakerVolumeThreshold: 20,
    bulkheadEnabled: true,
    bulkheadPoolSizeWebhook: 2, // low size for testing limits
    bulkheadPoolSizeDatabase: 5,
    bulkheadPoolSizeQueue: 5,
    backpressureEnabled: true,
    backpressureQueueDepthThreshold: 100,
    backpressureAlarmThreshold: 80,
    backpressureSheddingStrategy: 'DROP_LATEST',
    maxRetries: 5,
    backoffBaseMs: 1000,
    backoffMaxMs: 10000,
    backoffJitterFactor: 0.2,
    retryableStatusCodes: [],
    permanentStatusCodes: [],
  };

  beforeAll(async () => {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    await redis.ping();
  });

  afterAll(async () => {
    await redis.quit();
  });

  beforeEach(async () => {
    await redis.flushdb();
    manager = new BulkheadManager(redis, config, logger, {});
  });

  it('should acquire slots in Redis ZSET and throw PoolExhaustedError when max slots are allocated', async () => {
    const pool = 'webhook_pool';

    const w1 = await manager.acquire(pool);
    const w2 = await manager.acquire(pool);

    expect(w1).toBeDefined();
    expect(w2).toBeDefined();

    // Limit of 2, 3rd acquisition should fail
    await expect(manager.acquire(pool)).rejects.toThrow(PoolExhaustedError);

    // Release slot
    await manager.release(pool, w1);

    // Now acquisition should succeed
    const w3 = await manager.acquire(pool);
    expect(w3).toBeDefined();
  });
});
