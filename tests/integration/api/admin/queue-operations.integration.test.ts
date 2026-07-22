import request from 'supertest';
import { setupIntegrationTestStack } from '../../setup';
import { teardownIntegrationTestStack } from '../../teardown';
import { createApp } from '../../../../src/api/app';
import { Validator } from '../../../../src/security/validation/validator';

describe('Admin Queue Operations Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    await setupIntegrationTestStack();

    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as any;

    app = createApp({
      authGuard: { authenticate: async () => ({ type: 'api-key', subject: 'admin', scopes: ['admin'] }) } as any,
      rateLimiter: { checkLimit: async () => ({ allowed: true, remaining: 100, resetAt: new Date() }) } as any,
      validator: new Validator(logger),
      logger,
      resultController: {} as any,
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

  it('should pause and clear queue via REST dispatches', async () => {
    const pauseRes = await request(app)
      .post('/admin/api/v1/queue/pause')
      .set('Authorization', 'Bearer admin-token')
      .send({ name: 'results-queue' });

    expect(pauseRes.status).toBe(200);
    expect(pauseRes.body.status).toBe('paused');

    const clearRes = await request(app)
      .post('/admin/api/v1/queue/clear')
      .set('Authorization', 'Bearer admin-token')
      .send({ name: 'results-queue', confirm: true });

    expect(clearRes.status).toBe(200);
    expect(clearRes.body.status).toBe('cleared');
  });
});
