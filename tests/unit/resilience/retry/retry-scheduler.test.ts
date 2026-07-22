import { RetryScheduler } from '../../../../src/resilience/retry/retry-scheduler';
import { IDeliveryLogRepository as DeliveryRepository } from '../../../../src/domain/repositories/IDeliveryLogRepository';
import { IQueueService as Queue } from '../../../../src/application/interfaces/IQueueService';
import { AuditLogger } from '../../../../src/infrastructure/repositories/base.repository';
import { Delivery } from '../../../../src/domain/entities/delivery.entity';

describe('RetryScheduler Unit Tests', () => {
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

  let mockDeliveryRepo: jest.Mocked<DeliveryRepository>;
  let mockQueue: jest.Mocked<Queue>;
  let mockLogger: jest.Mocked<AuditLogger>;
  let scheduler: RetryScheduler;

  beforeEach(() => {
    mockDeliveryRepo = {
      save: jest.fn().mockImplementation(async d => d),
      findByTaskResultId: jest.fn(),
      findByDestinationId: jest.fn(),
      findAll: jest.fn(),
      findStale: jest.fn(),
      findByStatus: jest.fn(),
    };

    mockQueue = {
      enqueueDelivery: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    scheduler = new RetryScheduler(mockQueue, config, mockLogger, mockDeliveryRepo);
  });

  it('should update nextRetryAt and enqueue job in queue for valid retries', async () => {
    const delivery = Delivery.restore({
      id: 'del-123',
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

    await scheduler.scheduleRetry('del-123', 0, 5000);

    expect(delivery.getStatus().kind).toBe('scheduled_retry');
    expect(delivery.getNextRetryAt()).not.toBeNull();

    expect(mockQueue.enqueueDelivery).toHaveBeenCalledWith('task-123', 'dest-456', 1, 5000);
    expect(mockDeliveryRepo.save).toHaveBeenCalledWith(delivery);
  });

  it('should transition status to FAILED_DLQ upon cancelRetry execution', async () => {
    const delivery = Delivery.restore({
      id: 'del-123',
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

    await scheduler.cancelRetry('del-123');

    expect(delivery.getStatus().kind).toBe('failed_dlq');
    expect(mockDeliveryRepo.save).toHaveBeenCalledWith(delivery);
  });
});
