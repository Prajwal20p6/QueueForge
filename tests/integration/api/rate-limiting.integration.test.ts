import request from 'supertest';
import { createApp } from '../../../src/api/app-factory';

describe('Rate Limiting Integration Tests', () => {
  let app: any;
  let mockRateLimiter: any;

  beforeEach(() => {
    let hits = 0;
    mockRateLimiter = {
      checkLimit: jest.fn().mockImplementation(async () => {
        hits++;
        if (hits > 2) {
          return { allowed: false, limit: 2, remaining: 0, retryAfterSeconds: 60, resetTime: new Date() };
        }
        return { allowed: true, limit: 2, remaining: 2 - hits, resetTime: new Date() };
      }),
      getHeaders: jest.fn().mockReturnValue({ 'X-RateLimit-Limit': '2', 'X-RateLimit-Remaining': '0' }),
    };

    app = createApp({
      rateLimiter: mockRateLimiter,
    });
  });

  it('should enforce rate limit and return 429 Too Many Requests when breached', async () => {
    await request(app).get('/deliveries');
    await request(app).get('/deliveries');
    const response = await request(app).get('/deliveries');

    expect(response.status).toBe(429);
    expect(response.body.code).toBe('RATE_LIMITED');
  });
});
