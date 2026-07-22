import { rateLimitMiddleware } from '../../../../src/api/middleware/rate-limit.middleware';

describe('rateLimitMiddleware Unit Tests', () => {
  let mockRateLimiter: any;
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    mockRateLimiter = {
      checkLimit: jest.fn(),
      getHeaders: jest.fn().mockReturnValue({ 'X-RateLimit-Limit': '100', 'X-RateLimit-Remaining': '99' }),
    };

    req = { path: '/results', ip: '127.0.0.1' };
    res = { setHeader: jest.fn() };
    next = jest.fn();
  });

  it('should allow request and set rate limit headers when limit is not exceeded', async () => {
    mockRateLimiter.checkLimit.mockResolvedValue({ allowed: true, limit: 100, remaining: 99, resetTime: new Date() });

    const middleware = rateLimitMiddleware(mockRateLimiter);
    await middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with RateLimitError when limit is exceeded', async () => {
    mockRateLimiter.checkLimit.mockResolvedValue({ allowed: false, limit: 100, remaining: 0, retryAfterSeconds: 60, resetTime: new Date() });

    const middleware = rateLimitMiddleware(mockRateLimiter);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ name: 'RateLimitError' }));
  });
});
