import request from 'supertest';
import { createApp } from '../../../src/api/app';
import { LineageController } from '../../../src/api/controllers/lineage.controller';
import { Validator } from '../../../src/security/validation/validator';

describe('Lineage Integration Tests', () => {
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
            id: 'result-1',
            emailId: 'test@example.com',
            agentId: 'classifier-agent',
            agentVersion: '1.0',
            resultPayload: { key: 'value' },
            confidenceScore: 0.95,
            createdAt: new Date(),
          },
        ],
      }),
    };
    deliveryRepository = {
      findDeliveriesByResultId: jest.fn().mockResolvedValue([
        {
          destinationId: 'dest-1',
          status: 'COMPLETED',
          retryCount: 0,
          attempts: [],
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

  it('should return 200 and serialize lineage on valid GET', async () => {
    const res = await request(app)
      .get('/v1/lineage/test@example.com')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.emailId).toBe('test@example.com');
    expect(res.body.summary.totalAgents).toBe(1);
    expect(res.body.summary.completedCount).toBe(1);
  });

  it('should return 404 if no results exist', async () => {
    resultRepository.findMany.mockResolvedValue({ data: [] });
    const res = await request(app)
      .get('/v1/lineage/test@example.com')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(404);
  });
});
