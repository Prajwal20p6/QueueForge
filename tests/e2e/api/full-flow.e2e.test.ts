import request from 'supertest';
import { createApp } from '../../../src/api/app';
import { ResultController } from '../../../src/api/controllers/result.controller';
import { Validator } from '../../../src/security/validation/validator';

describe('Full E2E Ingestion Routing Flow', () => {
  let app: any;
  let ingestService: any;
  let repository: any;
  let logger: any;
  let authGuard: any;
  let rateLimiter: any;
  let validator: any;
  let observability: any;

  beforeEach(() => {
    ingestService = {
      ingest: jest.fn().mockResolvedValue({
        resultId: 'e2e-result-uuid-1',
        status: 'accepted',
        queuedAt: new Date(),
        destinationCount: 2,
      }),
    };
    repository = {};
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    authGuard = {
      authenticate: jest.fn().mockResolvedValue({
        type: 'jwt',
        subject: 'admin-user',
        scopes: [],
      }),
    };
    rateLimiter = {
      checkLimit: jest.fn().mockResolvedValue({
        allowed: true,
        remaining: 100,
        resetAt: new Date(),
      }),
    };
    validator = new Validator(logger);
    observability = {
      tracer: {
        getTracer: jest.fn().mockReturnValue({
          startSpan: jest.fn().mockReturnValue({
            setAttribute: jest.fn(),
            recordException: jest.fn(),
            end: jest.fn(),
          }),
        }),
      },
    };

    const resultController = new ResultController(
      ingestService,
      repository,
      logger,
      observability
    );
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

  it('should swallow valid ingest results and trigger pipeline routing', async () => {
    const payload = {
      emailId: 'user@test.com',
      agentId: 'classification-agent-e2e',
      agentVersion: '2.0',
      resultPayload: { category: 'billing' },
      confidenceScore: 0.99,
    };

    const res = await request(app)
      .post('/v1/results')
      .set('Authorization', 'Bearer valid-token')
      .send(payload);

    expect(res.status).toBe(202);
    expect(res.header.location).toBe('/v1/results/e2e-result-uuid-1');
    expect(ingestService.ingest).toHaveBeenCalledWith(
      expect.objectContaining({ emailId: 'user@test.com' }),
      expect.any(Object)
    );
  });
});
