import request from 'supertest';
import { setupIntegrationTestStack } from '../../setup';
import { teardownIntegrationTestStack } from '../../teardown';
import { createApp } from '../../../../src/api/app';
import { Validator } from '../../../../src/security/validation/validator';

describe('Admin Configuration Integration Tests', () => {
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

  it('should get and update runtime configurations settings', async () => {
    const getRes = await request(app)
      .get('/admin/api/v1/configuration')
      .set('Authorization', 'Bearer admin-token');

    expect(getRes.status).toBe(200);
    expect(getRes.body.retentionDays).toBe(30);

    const updateRes = await request(app)
      .patch('/admin/api/v1/configuration')
      .set('Authorization', 'Bearer admin-token')
      .send({ retentionDays: 60 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe('updated');
  });
});
