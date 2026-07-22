import request from 'supertest';
import { createApp } from '../../../src/api/app';
import { HealthController } from '../../../src/api/controllers/health.controller';
import { Validator } from '../../../src/security/validation/validator';

describe('Health Integration Tests', () => {
  let app: any;
  let checker: any;
  let logger: any;
  let authGuard: any;
  let rateLimiter: any;
  let validator: any;

  beforeEach(() => {
    checker = {
      checkAll: jest.fn().mockResolvedValue({
        overall: 'HEALTHY',
        database: 'HEALTHY',
        redis: 'HEALTHY',
        queue: 'HEALTHY',
      }),
      checkDatabase: jest.fn().mockResolvedValue('HEALTHY'),
      checkRedis: jest.fn().mockResolvedValue('HEALTHY'),
    };
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    authGuard = {
      authenticate: jest.fn(),
    };
    rateLimiter = {
      checkLimit: jest.fn(),
    };
    validator = new Validator(logger);

    const resultController = {} as any;
    const lineageController = {} as any;
    const destinationController = {} as any;
    const deliveryController = {} as any;
    const healthController = new HealthController(checker, logger);
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

  it('should return 200 health check status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.overall).toBe('HEALTHY');
  });

  it('should return 200 readiness status if database and redis are healthy', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('READY');
  });
});
