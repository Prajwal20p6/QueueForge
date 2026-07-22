import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';
import Redis from 'ioredis';

describe('Redis Cluster Integration Tests', () => {
  let redis: Redis;

  beforeAll(async () => {
    const stack = await setupIntegrationTestStack();
    redis = stack.redis;
  });

  afterAll(async () => {
    await teardownIntegrationTestStack();
  });

  it('should process multi-key hash writes successfully', async () => {
    await redis.hset('redis-cluster-test-hash', { field1: 'val1', field2: 'val2' });
    const fields = await redis.hgetall('redis-cluster-test-hash');
    expect(fields.field1).toBe('val1');
    expect(fields.field2).toBe('val2');
  });
});
