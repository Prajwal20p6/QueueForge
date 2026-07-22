import { JobProcessor } from '../../../../src/worker/processor/job-processor';
import { DeliveryStatus } from '@prisma/client';

// Mock dependencies
jest.mock('../../../../src/infrastructure/database/client', () => ({
  getPrismaClient: jest.fn().mockReturnValue({}),
}));
jest.mock('../../../../src/infrastructure/redis/client', () => {
  const Redis = require('ioredis');
  return {
    getRedisClient: jest.fn().mockReturnValue(new Redis()),
  };
});
jest.mock('../../../../src/infrastructure/queue/bullmq-client', () => ({
  QueueManager: jest.fn().mockImplementation(() => ({
    getMainQueue: jest.fn().mockReturnValue({
      add: jest.fn().mockResolvedValue({ id: 'job-id' }),
    }),
  })),
}));
jest.mock('../../../../src/security', () => ({
  createSecurityContext: jest.fn().mockReturnValue({}),
}));
jest.mock('../../../../src/config', () => ({
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
jest.mock('../../../../src/worker/processor/delivery-executor', () => {
  return {
    DeliveryExecutor: jest.fn().mockImplementation(() => ({
      execute: jest.fn().mockResolvedValue({
        success: true,
        statusCode: 200,
        latencyMs: 10,
      }),
    })),
  };
});

describe('JobProcessor Unit Tests', () => {
  let processor: JobProcessor;
  let repositories: any;
  let services: any;
  let resilience: any;
  let observability: any;
  let logger: any;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
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
      logger,
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

    processor = new JobProcessor(repositories, services, resilience, observability, logger);
  });

  it('should validate job structure correctly', async () => {
    const validJob: any = { data: { taskResultId: 'result-1', destinationId: 'dest-1' } };
    await expect(processor.validate(validJob)).resolves.not.toThrow();

    const invalidJob: any = { data: {} };
    await expect(processor.validate(invalidJob)).rejects.toThrow();
  });

  it('should successfully run process and transition delivery status to completed', async () => {
    const job: any = {
      id: 'job-1',
      timestamp: Date.now(),
      data: { taskResultId: 'result-1', destinationId: 'dest-1' },
    };

    const res = await processor.process(job);
    expect(res.status).toBe(DeliveryStatus.COMPLETED);
    expect(repositories.deliveries.findOne).toHaveBeenCalled();
  });
});
