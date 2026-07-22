import request from 'supertest';
import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';
import { createApp } from '../../../src/api/app';
import { Validator } from '../../../src/security/validation/validator';

describe('Analytics Reporting Integration Tests', () => {
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

  it('should generate digests reports on-demand and configure schedules', async () => {
    const genRes = await request(app)
      .post('/v1/analytics/reports/generate')
      .set('Authorization', 'Bearer admin-token')
      .send({ type: 'daily' });

    expect(genRes.status).toBe(200);
    expect(genRes.body.type).toBe('daily');
    expect(genRes.body.metrics.totalProcessed).toBe(14500);

    const schedRes = await request(app)
      .post('/v1/analytics/reports/schedule')
      .set('Authorization', 'Bearer admin-token')
      .send({ type: 'weekly', cron: '0 12 * * 1' });

    expect(schedRes.status).toBe(202);
    expect(schedRes.body.status).toBe('scheduled');
  });
});
