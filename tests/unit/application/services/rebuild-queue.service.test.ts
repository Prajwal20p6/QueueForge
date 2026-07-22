import { RebuildQueueService } from '../../../../src/application/services/recovery/rebuild-queue.service';
import { IDeliveryLogRepository as DeliveryRepository } from '../../../../src/domain/repositories/IDeliveryLogRepository';
import { IQueueService as Queue } from '../../../../src/application/interfaces/IQueueService';
import { AuditLogger } from '../../../../src/infrastructure/repositories/base.repository';
import { Delivery } from '../../../../src/domain/entities/delivery.entity';

describe('RebuildQueueService Unit Tests', () => {
  let mockDeliveryRepo: jest.Mocked<DeliveryRepository>;
  let mockQueue: jest.Mocked<Queue>;
  let mockLogger: jest.Mocked<AuditLogger>;
  let service: RebuildQueueService;

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

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    service = new RebuildQueueService(mockDeliveryRepo, mockQueue, mockLogger);
  });

  it('should clean BullMQ queue and rebuild jobs from database pending/retry records', async () => {
    const pendingD = Delivery.restore({
      id: 'del-1',
      taskResultId: 'task-123',
      destinationId: 'dest-1',
      status: { kind: 'pending' },
      retryCount: 0,
      nextRetryAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const retryD = Delivery.restore({
      id: 'del-2',
      taskResultId: 'task-456',
      destinationId: 'dest-2',
      status: { kind: 'scheduled_retry' },
      retryCount: 2,
      nextRetryAt: new Date(Date.now() + 5000),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    mockDeliveryRepo.findByStatus.mockImplementation(async (status: string) => {
      if (status === 'PENDING') return [pendingD];
      if (status === 'SCHEDULED_RETRY') return [retryD];
      return [];
    });

    // Mock BullMQ queue clean methods
    const mockBullQueue = {
      clean: jest.fn().mockResolvedValue([]),
    };
    (mockQueue as any).getQueueInstance = () => mockBullQueue;

    const res = await service.rebuildQueues();

    expect(res.main).toBe(1);
    expect(res.delayed).toBe(1);
    expect(res.dlq).toBe(0);

    expect(mockBullQueue.clean).toHaveBeenCalledTimes(3);
    expect(mockQueue.enqueueDelivery).toHaveBeenCalledWith('task-123', 'dest-1', 1);
    expect(mockQueue.enqueueDelivery).toHaveBeenCalledWith(
      'task-456',
      'dest-2',
      3,
      expect.any(Number)
    );
  });
});
