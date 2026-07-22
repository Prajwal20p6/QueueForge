import request from 'supertest';
import { createApp } from '../../../src/api/app';
import { DeliveryController } from '../../../src/api/controllers/delivery.controller';
import { Validator } from '../../../src/security/validation/validator';
import { DeliveryStatus } from '@prisma/client';

describe('Manual DLQ Retry E2E Flow', () => {
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
      findById: jest.fn().mockResolvedValue({
        id: 'del-uuid-1',
        taskResultId: 'res-uuid-1',
        destinationId: 'dest-uuid-1',
        status: DeliveryStatus.FAILED_DLQ,
        retryCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      update: jest.fn().mockResolvedValue({
        id: 'del-uuid-1',
        status: DeliveryStatus.PENDING,
        retryCount: 0,
      }),
    };
    attemptRepository = {};
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

  it('should accept retry trigger, move status to PENDING and re-enqueue in BullMQ', async () => {
    const res = await request(app)
      .patch('/v1/deliveries/del-uuid-1/retry')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('PENDING');
    expect(deliveryRepository.update).toHaveBeenCalled();
    expect(queue.add).toHaveBeenCalled();
  });
});
