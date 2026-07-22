import Redis from 'ioredis';
import { RetryScheduler } from '../../../src/resilience/retry/retry-scheduler';
import { IQueueService as Queue } from '../../../src/application/interfaces/IQueueService';
import { IDeliveryLogRepository as DeliveryRepository } from '../../../src/domain/repositories/IDeliveryLogRepository';

import { logger } from '../../../src/infrastructure/logging/logger';
import { Delivery } from '../../../src/domain/entities/delivery.entity';

describe('RetryScheduler Integration Tests', () => {
  let redis: Redis;
  let mockQueue: jest.Mocked<Queue>;
  let mockDeliveryRepo: jest.Mocked<DeliveryRepository>;
  let scheduler: RetryScheduler;

  const config: any = {
    circuitBreakerEnabled: true,
    circuitBreakerThreshold: 50,
    circuitBreakerTimeout: 60,
    circuitBreakerVolumeThreshold: 20,
    bulkheadEnabled: true,
    bulkheadPoolSizeWebhook: 5,
    bulkheadPoolSizeDatabase: 5,
    bulkheadPoolSizeQueue: 5,
    backpressureEnabled: true,
    backpressureQueueDepthThreshold: 100,
    backpressureAlarmThreshold: 80,
    backpressureSheddingStrategy: 'DROP_LATEST',
    maxRetries: 5,
    backoffBaseMs: 1000,
    backoffMaxMs: 10000,
    backoffJitterFactor: 0.2,
    retryableStatusCodes: [],
    permanentStatusCodes: [],
  };

  beforeAll(async () => {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    await redis.ping();
  });

  afterAll(async () => {
    await redis.quit();
  });

  beforeEach(async () => {
    await redis.flushdb();

    mockQueue = {
      enqueueDelivery: jest.fn(),
    };

    mockDeliveryRepo = {
      save: jest.fn().mockImplementation(async d => d),
      findByTaskResultId: jest.fn(),
      findByDestinationId: jest.fn(),
      findAll: jest.fn(),
      findStale: jest.fn(),
      findByStatus: jest.fn(),
    };

    scheduler = new RetryScheduler(mockQueue, config, logger, mockDeliveryRepo);
  });

  it('should successfully schedule retry job in queue and save state changes in PostgreSQL', async () => {
    const delivery = Delivery.restore({
      id: 'del-uuid',
      taskResultId: 'task-123',
      destinationId: 'dest-456',
      status: { kind: 'pending' },
      retryCount: 0,
      nextRetryAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    mockDeliveryRepo.findByTaskResultId.mockResolvedValue([delivery]);

    await scheduler.scheduleRetry('del-uuid', 0, 5000);

    expect(delivery.getStatus().kind).toBe('scheduled_retry');
    expect(delivery.getNextRetryAt()).not.toBeNull();
    expect(mockQueue.enqueueDelivery).toHaveBeenCalledWith('task-123', 'dest-456', 1, 5000);
    expect(mockDeliveryRepo.save).toHaveBeenCalledWith(delivery);
  });
});
