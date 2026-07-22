import request from 'supertest';
import { setupIntegrationTestStack } from '../../setup';
import { teardownIntegrationTestStack } from '../../teardown';
import { createApp } from '../../../../src/api/app';
import { Validator } from '../../../../src/security/validation/validator';

describe('Admin Dashboard Integration Tests', () => {
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

  it('should fetch admin dashboard overview successfully with authorized admin auth', async () => {
    const res = await request(app)
      .get('/admin/api/v1/dashboard')
      .set('Authorization', 'Bearer admin-token');

    expect(res.status).toBe(200);
    expect(res.body.overview.systemStatus).toBe('HEALTHY');
  });

  it('should fail with status 401 if request is unauthenticated', async () => {
    const unauthenticatedApp = createApp({
      authGuard: { authenticate: async () => null } as any,
      rateLimiter: { checkLimit: async () => ({ allowed: true, remaining: 100, resetAt: new Date() }) } as any,
      validator: {} as any,
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as any,
      resultController: {} as any,
      lineageController: {} as any,
      destinationController: {} as any,
      deliveryController: {} as any,
      healthController: {} as any,
      dashboardController: {} as any,
    });

    const res = await request(unauthenticatedApp)
      .get('/admin/api/v1/dashboard');

    expect(res.status).toBe(401);
  });
});
