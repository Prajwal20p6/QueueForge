import { initializeWorker, Worker } from '../../../src/worker';
import { DeliveryStatus } from '@prisma/client';

// Mock dependencies
jest.mock('../../../src/infrastructure/database/client', () => ({
  getPrismaClient: jest.fn().mockReturnValue({}),
}));
jest.mock('../../../src/infrastructure/redis/client', () => {
  const Redis = require('ioredis');
  return {
    getRedisClient: jest.fn().mockReturnValue(new Redis()),
  };
});
jest.mock('../../../src/infrastructure/queue/bullmq-client', () => ({
  QueueManager: jest.fn().mockImplementation(() => ({
    getMainQueue: jest.fn().mockReturnValue({
      add: jest.fn().mockResolvedValue({ id: 'job-id' }),
    }),
  })),
}));
jest.mock('bullmq', () => {
  return {
    Queue: jest.fn().mockImplementation(() => ({
      name: 'test-queue',
      add: jest.fn().mockResolvedValue({ id: 'job-id' }),
    })),
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    })),
  };
});
jest.mock('../../../src/security', () => ({
  createSecurityContext: jest.fn().mockReturnValue({}),
}));
jest.mock('../../../src/config', () => ({
  getConfig: jest.fn().mockReturnValue({
    queue: {},
    resilience: {
      maxRetries: 3,
      backoffBaseMs: 100,
      backoffMaxMs: 1000,
      backoffJitterFactor: 0,
    },
  }),
}));

describe('Processor Integration Tests', () => {
  let worker: Worker;
  let config: any;
  let queue: any;
  let repositories: any;
  let services: any;
  let resilience: any;
  let observability: any;
  let security: any;

  beforeEach(async () => {
    config = { name: 'test-app' };
    queue = { name: 'test-queue' };
    repositories = {
      deliveries: {
        findOne: jest.fn().mockResolvedValue({
          id: 'delivery-1',
          taskResultId: 'result-1',
          destinationId: 'dest-1',
          retryCount: 0,
        }),
        findById: jest.fn().mockResolvedValue({
          id: 'delivery-1',
          status: DeliveryStatus.PROCESSING,
          retryCount: 0,
        }),
        updateDeliveryStatus: jest.fn(),
      },
      destinations: {
        findById: jest.fn().mockResolvedValue({
          id: 'dest-1',
          endpointUrl: 'http://localhost/webhook',
          destinationType: 'WEBHOOK',
        }),
      },
      results: {
        findById: jest.fn().mockResolvedValue({
          id: 'result-1',
          resultPayload: {},
        }),
      },
      attempts: {
        recordAttempt: jest.fn(),
      },
    };
    services = {
      scheduleRetry: {
        scheduleRetry: jest.fn(),
      },
    };
    resilience = {
      circuitBreaker: {
        getOrCreateBreaker: jest.fn().mockReturnValue({
          success: jest.fn(),
          failure: jest.fn(),
        }),
        isOpen: jest.fn().mockResolvedValue(false),
      },
      bulkhead: {
        acquire: jest.fn().mockResolvedValue('slot-1'),
        release: jest.fn(),
      },
    };
    observability = {
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      },
      metrics: {
        getMeter: jest.fn().mockReturnValue({
          createCounter: jest.fn().mockReturnValue({
            add: jest.fn(),
          }),
          createHistogram: jest.fn().mockReturnValue({
            record: jest.fn(),
          }),
        }),
      },
      tracer: {
        getTracer: jest.fn().mockReturnValue({
          startSpan: jest.fn().mockReturnValue({
            setAttribute: jest.fn(),
            end: jest.fn(),
          }),
        }),
        getTraceId: jest.fn().mockReturnValue('trace-123'),
      },
    };
    security = {
      signer: {
        sign: jest.fn().mockReturnValue('signature'),
      },
    };

    worker = await initializeWorker(
      config,
      queue,
      repositories,
      services,
      resilience,
      observability,
      security
    );
  });

  afterEach(async () => {
    await worker.stop();
  });

  it('should successfully run worker start loop and initialize parameters', () => {
    expect(worker.isRunning()).toBe(true);
  });
});
