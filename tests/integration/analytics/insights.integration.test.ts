import request from 'supertest';
import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';
import { createApp } from '../../../src/api/app';
import { Validator } from '../../../src/security/validation/validator';

describe('Analytics Insights & Metrics Integration Tests', () => {
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

  it('should fetch system trends insights and business metrics', async () => {
    const insightsRes = await request(app)
      .get('/v1/analytics/insights')
      .set('Authorization', 'Bearer admin-token');

    expect(insightsRes.status).toBe(200);
    expect(insightsRes.body.length).toBeGreaterThan(0);

    const metricsRes = await request(app)
      .get('/v1/analytics/metrics')
      .set('Authorization', 'Bearer admin-token');

    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.totalProcessed).toBe(14500);
  });
});
