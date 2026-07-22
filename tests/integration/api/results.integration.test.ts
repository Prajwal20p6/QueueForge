import request from 'supertest';
import { createApp } from '../../../src/api/app';
import { ResultController } from '../../../src/api/controllers/result.controller';
import { Validator } from '../../../src/security/validation/validator';

describe('Results Integration Tests', () => {
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
        resultId: 'result-uuid-123',
        status: 'accepted',
        queuedAt: new Date(),
        destinationCount: 1,
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
        subject: 'user-123',
        scopes: [],
      }),
    };
    rateLimiter = {
      checkLimit: jest.fn().mockResolvedValue({
        allowed: true,
        remaining: 10,
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

  it('should return 202 and set location header on valid ingest POST', async () => {
    const payload = {
      emailId: 'test@example.com',
      agentId: 'classifier-agent',
      agentVersion: '1.0',
      resultPayload: { key: 'value' },
      confidenceScore: 0.95,
    };

    const res = await request(app)
      .post('/v1/results')
      .set('Authorization', 'Bearer token')
      .send(payload);

    expect(res.status).toBe(202);
    expect(res.header.location).toBe('/v1/results/result-uuid-123');
    expect(res.body.resultId).toBe('result-uuid-123');
  });

  it('should return 422 for missing fields', async () => {
    const res = await request(app)
      .post('/v1/results')
      .set('Authorization', 'Bearer token')
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });
});
