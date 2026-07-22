import request from 'supertest';
import { createApp } from '../../../src/api/app';
import { DestinationController } from '../../../src/api/controllers/destination.controller';
import { Validator } from '../../../src/security/validation/validator';

describe('Destinations Integration Tests', () => {
  let app: any;
  let registerService: any;
  let repository: any;
  let logger: any;
  let authGuard: any;
  let rateLimiter: any;
  let validator: any;
  let observability: any;

  beforeEach(() => {
    registerService = {
      register: jest.fn().mockResolvedValue({
        id: 'dest-123',
        endpointUrl: 'https://localhost/webhook',
        destinationType: 'WEBHOOK',
        enabled: true,
      }),
    };
    repository = {
      findMany: jest.fn().mockResolvedValue({
        data: [{ id: 'dest-123', endpointUrl: 'https://localhost/webhook', destinationType: 'WEBHOOK', enabled: true, createdAt: new Date() }],
        total: 1,
        hasMore: false,
      }),
      findDestinationById: jest.fn().mockResolvedValue({
        id: 'dest-123',
        endpointUrl: 'https://localhost/webhook',
        destinationType: 'WEBHOOK',
        enabled: true,
        createdAt: new Date(),
      }),
      update: jest.fn().mockResolvedValue({
        id: 'dest-123',
        endpointUrl: 'https://localhost/webhook-updated',
        destinationType: 'WEBHOOK',
        enabled: true,
        createdAt: new Date(),
      }),
      delete: jest.fn(),
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
    const lineageController = {} as any;
    const destinationController = new DestinationController(
      registerService,
      repository,
      logger,
      observability
    );
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

  it('should post and register destination route', async () => {
    const payload = {
      endpointUrl: 'https://localhost/webhook',
      destinationType: 'WEBHOOK',
    };

    const res = await request(app)
      .post('/v1/destinations')
      .set('Authorization', 'Bearer token')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.header.location).toBe('/v1/destinations/dest-123');
  });

  it('should list all destinations', async () => {
    const res = await request(app)
      .get('/v1/destinations')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });
});
