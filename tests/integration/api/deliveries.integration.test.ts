import request from 'supertest';
import { createApp } from '../../../src/api/app';
import { DeliveryController } from '../../../src/api/controllers/delivery.controller';
import { Validator } from '../../../src/security/validation/validator';
import { DeliveryStatus } from '@prisma/client';

describe('Deliveries Integration Tests', () => {
  let app: any;
  let deliveryRepository: any;
  let attemptRepository: any;
  let logger: any;
  let authGuard: any;
  let rateLimiter: any;
  let validator: any;
  let observability: any;
  let queue: any;

  beforeEach(() => {
    deliveryRepository = {
      findDeliveryById: jest.fn().mockResolvedValue({
        id: 'del-123',
        taskResultId: 'res-1',
        destinationId: 'dest-1',
        status: DeliveryStatus.PENDING,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      findMany: jest.fn().mockResolvedValue({
        data: [{ id: 'del-123', taskResultId: 'res-1', destinationId: 'dest-1', status: DeliveryStatus.PENDING, retryCount: 0, createdAt: new Date(), updatedAt: new Date() }],
        total: 1,
        hasMore: false,
      }),
      findById: jest.fn().mockResolvedValue({
        id: 'del-123',
        taskResultId: 'res-1',
        destinationId: 'dest-1',
        status: DeliveryStatus.FAILED_DLQ,
        retryCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      update: jest.fn(),
    };
    attemptRepository = {
      findMany: jest.fn().mockResolvedValue({ data: [] }),
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
    queue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };

    const resultController = {} as any;
    const lineageController = {} as any;
    const destinationController = {} as any;
    const deliveryController = new DeliveryController(
      deliveryRepository,
      attemptRepository,
      logger,
      observability,
      queue
    );
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

  it('should return delivery payload details', async () => {
    const res = await request(app)
      .get('/v1/deliveries/del-123')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('del-123');
  });

  it('should accept manual DLQ retry trigger', async () => {
    const res = await request(app)
      .patch('/v1/deliveries/del-123/retry')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(202);
    expect(deliveryRepository.update).toHaveBeenCalled();
    expect(queue.add).toHaveBeenCalled();
  });
});
