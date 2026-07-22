import { ScheduleRetryService } from '../../../../src/application/services/delivery/schedule-retry.service';
import { IDeliveryLogRepository as DeliveryRepository } from '../../../../src/domain/repositories/IDeliveryLogRepository';
import { IQueueService as Queue } from '../../../../src/application/interfaces/IQueueService';
import { AuditLogger } from '../../../../src/infrastructure/repositories/base.repository';
import { Delivery } from '../../../../src/domain/entities/delivery.entity';
import { RetryStrategy } from '../../../../src/domain/value-objects/retry-strategy';

describe('ScheduleRetryService Unit Tests', () => {
  let mockDeliveryRepo: jest.Mocked<DeliveryRepository>;
  let mockQueue: jest.Mocked<Queue>;
  let mockLogger: jest.Mocked<AuditLogger>;
  let service: ScheduleRetryService;

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

    service = new ScheduleRetryService(mockDeliveryRepo, mockQueue, mockLogger);
  });

  it('should compute delay, set status to scheduled_retry, and enqueue delayed job to BullMQ', async () => {
    const deliveryId = 'del-123';
    const delivery = Delivery.restore({
      id: deliveryId,
      taskResultId: 'task-123',
      destinationId: 'dest-456',
      status: { kind: 'pending' },
      retryCount: 1,
      nextRetryAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    mockDeliveryRepo.findByTaskResultId.mockResolvedValue([delivery]);

    const strategy = RetryStrategy.create(1000, 10000, 5, 0.0); // 0 jitter for deterministic math

    await service.scheduleRetry(deliveryId, 1, strategy);

    expect(delivery.getStatus().kind).toBe('scheduled_retry');
    expect(delivery.getNextRetryAt()).not.toBeNull();

    // scaling: 2^1 * 1000 = 2000ms delay
    expect(mockQueue.enqueueDelivery).toHaveBeenCalledWith('task-123', 'dest-456', 2, 2000);
    expect(mockDeliveryRepo.save).toHaveBeenCalledWith(delivery);
  });

  it('should throw error if retry count exceeds strategy maximum', async () => {
    const strategy = RetryStrategy.create(1000, 10000, 3);
    await expect(service.scheduleRetry('del-123', 3, strategy)).rejects.toThrow();
  });
});
