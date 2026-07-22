import request from 'supertest';
import { setupIntegrationTestStack } from '../../setup';
import { teardownIntegrationTestStack } from '../../teardown';
import { createApp } from '../../../../src/api/app';
import { Validator } from '../../../../src/security/validation/validator';

describe('Admin User Management Integration Tests', () => {
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

  it('should list and create admin users dynamically', async () => {
    const listRes = await request(app)
      .get('/admin/api/v1/users')
      .set('Authorization', 'Bearer admin-token');

    expect(listRes.status).toBe(200);
    expect(listRes.body.total).toBe(1);

    const createRes = await request(app)
      .post('/admin/api/v1/users')
      .set('Authorization', 'Bearer admin-token')
      .send({ email: 'new-operator@oneinbox.ai', roles: ['operator'] });

    expect(createRes.status).toBe(201);
    expect(createRes.body.email).toBe('new-operator@oneinbox.ai');
  });
});
