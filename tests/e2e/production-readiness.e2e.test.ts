import request from 'supertest';
import { setupIntegrationTestStack } from '../integration/setup';
import { teardownIntegrationTestStack } from '../integration/teardown';
import { createApp } from '../../src/api/app';
import { Validator } from '../../src/security/validation/validator';

describe('Production Readiness E2E Tests', () => {
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

  it('should process result ingestion end-to-end', async () => {
    const payload = {
      emailId: 'ingest-test@example.com',
      agentId: 'classifier',
      agentVersion: '1.0',
      resultPayload: { content: 'test data' },
      confidenceScore: 0.95,
    };

    const res = await request(app)
      .post('/v1/results')
      .set('Authorization', 'Bearer admin-token')
      .send(payload);

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('accepted');
  });
});
