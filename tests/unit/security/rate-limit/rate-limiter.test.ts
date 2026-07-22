import Redis from 'ioredis';
import { RateLimiter } from '../../../../src/security/rate-limit/rate-limiter';

describe('RateLimiter Unit Tests', () => {
  let mockRedis: jest.Mocked<Redis>;
  let limiter: RateLimiter;

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
    } as any;

    limiter = new RateLimiter(mockRedis);
  });

  it('should initialize and allow request on first call', async () => {
    mockRedis.get.mockResolvedValue(null);

    const allowed = await limiter.isAllowed('client-ip', 5, 60);
    expect(allowed).toBe(true);
    expect(mockRedis.setex).toHaveBeenCalledWith(
      'rate_limiter:client-ip',
      60,
      expect.stringContaining('"tokens":4')
    );
  });

  it('should deny request if tokens are exhausted', async () => {
    // Zero tokens remaining
    const state = { tokens: 0.5, lastRefillAt: Date.now() };
    mockRedis.get.mockResolvedValue(JSON.stringify(state));

    const allowed = await limiter.isAllowed('client-ip', 5, 60);
    expect(allowed).toBe(false);
    expect(mockRedis.setex).not.toHaveBeenCalled();
  });

  it('should refill tokens based on time elapsed', async () => {
    const limit = 5;
    const windowSeconds = 60;
    const refillRate = limit / windowSeconds; // 5/60 = 0.0833 tokens/second
    expect(refillRate).toBeCloseTo(0.0833, 4);

    const lastRefillAt = Date.now() - 12000; // 12 seconds ago (should refill 1 token)
    const state = { tokens: 0, lastRefillAt };
    mockRedis.get.mockResolvedValue(JSON.stringify(state));

    const allowed = await limiter.isAllowed('client-ip', limit, windowSeconds);
    expect(allowed).toBe(true); // refilled tokens = 12 * 0.0833 = 1. Remaining after request should be 0.
  });

  it('should accurately calculate remaining allowed requests stats', async () => {
    const state = { tokens: 3.5, lastRefillAt: Date.now() };
    mockRedis.get.mockResolvedValue(JSON.stringify(state));

    const remaining = await limiter.getRemainingRequests('client-ip', 5, 60);
    expect(remaining).toBe(3);
  });

  it('should reset rate limit key', async () => {
    await limiter.reset('client-ip');
    expect(mockRedis.del).toHaveBeenCalledWith('rate_limiter:client-ip');
  });
});
