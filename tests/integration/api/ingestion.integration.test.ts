import request from 'supertest';
import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';
import { createApp } from '../../../src/api/app';
import { ResultController } from '../../../src/api/controllers/result.controller';
import { Validator } from '../../../src/security/validation/validator';

describe('Ingestion End-to-End Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    await setupIntegrationTestStack();

    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as any;
    const repository = {} as any;
    const ingestService = {
      ingest: jest.fn().mockResolvedValue({
        resultId: 'result-uuid-123',
        status: 'accepted',
        queuedAt: new Date(),
        destinationCount: 1,
      }),
    } as any;

    const observability = {
      tracer: {
        getTracer: jest.fn().mockReturnValue({
          startSpan: jest.fn().mockReturnValue({
            setAttribute: jest.fn(),
            recordException: jest.fn(),
            end: jest.fn(),
          }),
        }),
      },
    } as any;

    const resultController = new ResultController(ingestService, repository, logger, observability);

    app = createApp({
      authGuard: { authenticate: async () => ({ type: 'api-key', subject: 'test', scopes: [] }) } as any,
      rateLimiter: { checkLimit: async () => ({ allowed: true, remaining: 100, resetAt: new Date() }) } as any,
      validator: new Validator(logger),
      logger,
      resultController,
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

  it('should process a valid result and return status 202', async () => {
    const payload = {
      emailId: 'ingest-test@example.com',
      agentId: 'classifier',
      agentVersion: '1.0',
      resultPayload: { content: 'test data' },
      confidenceScore: 0.95,
    };

    const res = await request(app)
      .post('/v1/results')
      .set('Authorization', 'Bearer test')
      .send(payload);

    expect(res.status).toBe(202);
  });
});
