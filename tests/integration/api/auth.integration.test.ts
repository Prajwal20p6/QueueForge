import request from 'supertest';
import { createApp } from '../../../src/api/app';
import { Validator } from '../../../src/security/validation/validator';
import { AuthenticationError } from '../../../src/shared/errors/authentication-error';

describe('Auth Integration Tests', () => {
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
      authenticate: jest.fn().mockImplementation((header) => {
        if (header === 'Bearer valid-jwt') {
          return Promise.resolve({
            type: 'jwt',
            subject: 'user-123',
            scopes: ['admin'],
          });
        }
        throw new AuthenticationError('Unauthorized credentials');
      }),
    };
    rateLimiter = {
      checkLimit: jest.fn().mockResolvedValue({
        allowed: true,
        remaining: 10,
        resetAt: new Date(),
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

  it('should accept requests with a valid authorization header', async () => {
    const res = await request(app)
      .post('/v1/results')
      .set('Authorization', 'Bearer valid-jwt')
      .send({
        emailId: 'test@example.com',
        agentId: 'agent',
        agentVersion: '1.0',
        resultPayload: { category: 'billing' },
        confidenceScore: 0.8,
      });

    expect(res.status).toBe(202);
  });

  it('should block requests with invalid authorization headers and return 401', async () => {
    const res = await request(app)
      .post('/v1/results')
      .set('Authorization', 'Bearer invalid-token')
      .send({});

    expect(res.status).toBe(401);
  });
});
