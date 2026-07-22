import { SyncStateService } from '../../../../src/application/services/recovery/sync-state.service';
import { IDeliveryLogRepository as DeliveryRepository } from '../../../../src/domain/repositories/IDeliveryLogRepository';
import { IQueueService as Queue } from '../../../../src/application/interfaces/IQueueService';
import { IdempotencyCache } from '../../../../src/infrastructure/cache/idempotency-cache';
import { AuditLogger } from '../../../../src/infrastructure/repositories/base.repository';
import { Delivery } from '../../../../src/domain/entities/delivery.entity';

describe('SyncStateService Unit Tests', () => {
  let mockDeliveryRepo: jest.Mocked<DeliveryRepository>;
  let mockQueue: jest.Mocked<Queue>;
  let mockCache: jest.Mocked<IdempotencyCache>;
  let mockLogger: jest.Mocked<AuditLogger>;
  let service: SyncStateService;

  beforeEach(() => {
    mockDeliveryRepo = {
      save: jest.fn(),
      findByTaskResultId: jest.fn(),
      findByDestinationId: jest.fn(),
      findAll: jest.fn(),
      findStale: jest.fn(),
      findByStatus: jest.fn(),
    };

    mockQueue = {
      enqueueDelivery: jest.fn(),
    } as any;

    mockCache = {} as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    service = new SyncStateService(mockDeliveryRepo, mockQueue, mockCache, mockLogger);
  });

  it('should re-enqueue pending deliveries that are missing in the BullMQ queue instance', async () => {
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

    mockDeliveryRepo.findByStatus.mockResolvedValue([delivery]);

    // Mock BullMQ queue instance getJobs
    const mockBullQueue = {
      getJobs: jest.fn().mockResolvedValue([]), // no jobs in queue
    };
    (mockQueue as any).getQueueInstance = () => mockBullQueue;

    const stats = await service.syncRedisWithDatabase();

    expect(stats.synced).toBe(1);
    expect(stats.errors).toBe(0);
    expect(mockQueue.enqueueDelivery).toHaveBeenCalledWith('task-123', 'dest-456', 1);
  });
});
