import request from 'supertest';
import { createApp } from '../../../src/api/app';
import { Validator } from '../../../src/security/validation/validator';

describe('Rate Limit Integration Tests', () => {
  let app: any;
  let logger: any;
  let authGuard: any;
  let rateLimiter: any;
  let validator: any;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    authGuard = {
      authenticate: jest.fn().mockResolvedValue({
        type: 'jwt',
        subject: 'user-123',
        scopes: [],
      }),
    };
    rateLimiter = {
      checkLimit: jest.fn().mockImplementation((key) => {
        if (key === 'blocked-key') {
          return Promise.resolve({
            allowed: false,
            remaining: 0,
            resetAt: new Date(Date.now() + 5000),
          });
        }
        return Promise.resolve({
          allowed: true,
          remaining: 10,
          resetAt: new Date(),
        });
      }),
    };
    validator = new Validator(logger);

    const resultController = {
      ingestResult: jest.fn().mockImplementation((_req, res) => res.status(202).json({ ok: true })),
    } as any;
    const lineageController = {} as any;
    const destinationController = {} as any;
    const deliveryController = {} as any;
    const healthController = {} as any;
    const dashboardController = {} as any;

    app = createApp({
      authGuard,
      rateLimiter,
      validator,
      logger,
      resultController,
      lineageController,
      destinationController,
      deliveryController,
      healthController,
      dashboardController,
    });
  });

  it('should block clients exceeding requests rate limits returning HTTP 429', async () => {
    const res = await request(app)
      .post('/v1/results')
      .set('Authorization', 'Bearer token')
      .set('X-API-Key', 'blocked-key')
      .send({});

    expect(res.status).toBe(429);
    expect(res.header['retry-after']).toBeDefined();
  });
});
