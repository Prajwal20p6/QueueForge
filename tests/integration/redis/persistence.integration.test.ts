import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';
import Redis from 'ioredis';

describe('Redis Persistence Integration Tests', () => {
  let redis: Redis;

  beforeAll(async () => {
    const stack = await setupIntegrationTestStack();
    redis = stack.redis;
  });

  afterAll(async () => {
    await teardownIntegrationTestStack();
  });

  it('should store and read values from cache and verify TTL settings', async () => {
    await redis.setex('integration-test-persist-key', 10, 'redis-data-val');
    const val = await redis.get('integration-test-persist-key');
    expect(val).toBe('redis-data-val');

    const ttl = await redis.ttl('integration-test-persist-key');
    expect(ttl).toBeGreaterThan(0);
  });
});
