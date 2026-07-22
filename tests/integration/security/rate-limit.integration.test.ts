import Redis from 'ioredis';
import { createRateLimiter, buildRateLimitKey } from '../../../src/security';

describe('Rate Limit Integration Tests', () => {
  let redis: Redis;

  beforeAll(async () => {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    await redis.ping();
  });

  afterAll(async () => {
    await redis.quit();
  });

  beforeEach(async () => {
    await redis.flushdb();
  });

  it('should restrict requests exceeding maximum allowed rate bounds', async () => {
    const limiter = createRateLimiter(redis, { rateLimitRequestsPerMinute: 2 } as any);
    const key = buildRateLimitKey('apikey-test', '/ingest', 'POST');

    // First request should be allowed
    const c1 = await limiter.checkLimit(key, 2, 60);
    expect(c1.allowed).toBe(true);
    expect(c1.remaining).toBe(1);

    // Second request should be allowed
    const c2 = await limiter.checkLimit(key, 2, 60);
    expect(c2.allowed).toBe(true);
    expect(c2.remaining).toBe(0);

    // Third request should be blocked
    const c3 = await limiter.checkLimit(key, 2, 60);
    expect(c3.allowed).toBe(false);
    expect(c3.remaining).toBe(0);
  });
});
