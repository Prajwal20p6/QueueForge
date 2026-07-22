import request from 'supertest';
import { setupIntegrationTestStack } from '../integration/setup';
import { teardownIntegrationTestStack } from '../integration/teardown';
import { createApp } from '../../src/api/app';
import { Validator } from '../../src/security/validation/validator';

describe('Security Audit Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    await setupIntegrationTestStack();

    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as any;

    app = createApp({
      authGuard: { authenticate: async () => ({ type: 'api-key', subject: 'admin', scopes: ['admin'] }) } as any,
      rateLimiter: { checkLimit: async () => ({ allowed: true, remaining: 100, resetAt: new Date() }) } as any,
      validator: new Validator(logger),
      logger,
      resultController: {
        ingestResult: async (_req: any, res: any) => res.status(202).json({ status: 'accepted' }),
      } as any,
      lineageController: {} as any,
      destinationController: {} as any,
      deliveryController: {} as any,
      healthController: {} as any,
      dashboardController: {} as any,
    });
  });

  afterAll(async () => {
    await teardownIntegrationTestStack();
  });

  it('should block unauthenticated access with 401', async () => {
    const res = await request(app)
      .post('/v1/results')
      .send({ payload: {} });

    expect(res.status).toBe(401);
  });
});
