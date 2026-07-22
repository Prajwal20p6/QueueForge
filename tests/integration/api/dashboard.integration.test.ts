import request from 'supertest';
import { createApp } from '../../../src/api/app';
import { DashboardController } from '../../../src/api/controllers/dashboard.controller';
import { Validator } from '../../../src/security/validation/validator';

jest.mock('../../../src/infrastructure/database/client', () => ({
  getPrismaClient: jest.fn().mockReturnValue({
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    taskResultDelivery: {
      count: jest.fn().mockResolvedValue(5),
      aggregate: jest.fn().mockResolvedValue({ _avg: { retryCount: 1 } }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    taskResultDeliveryAttempt: {
      aggregate: jest.fn().mockResolvedValue({ _avg: { responseTimeMs: 120 } }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  }),
}));

describe('Dashboard Integration Tests', () => {
  let app: any;
  let repositories: any;
  let metricsRegistry: any;
  let logger: any;
  let authGuard: any;
  let rateLimiter: any;
  let validator: any;
  let queue: any;
  let redis: any;

  beforeEach(() => {
    repositories = {};
    metricsRegistry = {
      getMeter: jest.fn().mockReturnValue({
        createUpDownCounter: jest.fn().mockReturnValue({
          add: jest.fn(),
        }),
        createHistogram: jest.fn().mockReturnValue({
          record: jest.fn(),
        }),
      }),
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
    queue = {
      getWaitingCount: jest.fn().mockResolvedValue(1),
      getActiveCount: jest.fn().mockResolvedValue(1),
      getDelayedCount: jest.fn().mockResolvedValue(1),
      getCompletedCount: jest.fn().mockResolvedValue(10),
      getFailedCount: jest.fn().mockResolvedValue(1),
      getJobCounts: jest.fn().mockResolvedValue({ waiting: 0 }),
    };
    redis = {
      ping: jest.fn().mockResolvedValue('PONG'),
      smembers: jest.fn().mockResolvedValue(['worker-1']),
      pipeline: jest.fn().mockReturnValue({
        exists: jest.fn(),
        exec: jest.fn().mockResolvedValue([[null, 1]]),
      }),
      ttl: jest.fn().mockResolvedValue(20),
      hgetall: jest.fn().mockResolvedValue({}),
    };

    const resultController = {} as any;
    const lineageController = {} as any;
    const destinationController = {} as any;
    const deliveryController = {} as any;
    const healthController = {} as any;
    const dashboardController = new DashboardController(
      repositories,
      metricsRegistry,
      logger,
      queue,
      redis
    );

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

  it('should return queue statistics details on GET request', async () => {
    const res = await request(app)
      .get('/v1/dashboard/queue-stats')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.depth.main).toBe(2);
  });
});
