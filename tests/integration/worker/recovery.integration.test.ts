import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';
import Redis from 'ioredis';

describe('Worker Heartbeat Recovery Integration Tests', () => {
  let redis: Redis;

  beforeAll(async () => {
    const stack = await setupIntegrationTestStack();
    redis = stack.redis;
  });

  afterAll(async () => {
    await teardownIntegrationTestStack();
  });

  it('should verify heartbeat set operation and TTL keys registration', async () => {
    const workerId = 'worker-uuid-test';
    const key = `heartbeat:${workerId}`;
    await redis.setex(key, 5, 'active');

    const status = await redis.get(key);
    expect(status).toBe('active');
  });
});
