import request from 'supertest';
import { createApp } from '../../../src/api/app';
import { LineageController } from '../../../src/api/controllers/lineage.controller';
import { Validator } from '../../../src/security/validation/validator';

describe('Unified Lineage Retrieval E2E Flow', () => {
  let app: any;
  let resultRepository: any;
  let deliveryRepository: any;
  let logger: any;
  let authGuard: any;
  let rateLimiter: any;
  let validator: any;
  let observability: any;

  beforeEach(() => {
    resultRepository = {
      findMany: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'result-uuid-1',
            emailId: 'billing@oneinbox.com',
            agentId: 'billing-classifier',
            agentVersion: '1.2.0',
            resultPayload: { classified: true },
            confidenceScore: 0.98,
            createdAt: new Date(),
          },
        ],
      }),
    };
    deliveryRepository = {
      findDeliveriesByResultId: jest.fn().mockResolvedValue([
        {
          destinationId: 'webhook-destination-uuid',
          status: 'COMPLETED',
          retryCount: 1,
          attempts: [
            {
              id: 'attempt-uuid',
              responseStatus: 200,
              responseTimeMs: 85,
              errorMessage: null,
              attemptedAt: new Date(),
            },
          ],
          destination: { destinationType: 'WEBHOOK' },
        },
      ]),
    };
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

    const resultController = {} as any;
    const lineageController = new LineageController(
      resultRepository,
      deliveryRepository,
      logger,
      observability
    );
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

  it('should query results and deliveries tracing records unified by emailId', async () => {
    const res = await request(app)
      .get('/v1/lineage/billing@oneinbox.com')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.emailId).toBe('billing@oneinbox.com');
    expect(res.body.summary.completedCount).toBe(1);
    expect(res.body.deliveries[0].destinationType).toBe('WEBHOOK');
  });
});
