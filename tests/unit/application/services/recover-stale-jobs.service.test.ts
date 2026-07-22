import { RecoverStaleJobsService } from '../../../../src/application/services/recovery/recover-stale-jobs.service';
import { IDeliveryLogRepository as DeliveryRepository } from '../../../../src/domain/repositories/IDeliveryLogRepository';
import { IQueueService as Queue } from '../../../../src/application/interfaces/IQueueService';
import { AuditLogger } from '../../../../src/infrastructure/repositories/base.repository';
import { Delivery } from '../../../../src/domain/entities/delivery.entity';

describe('RecoverStaleJobsService Unit Tests', () => {
  let mockDeliveryRepo: jest.Mocked<DeliveryRepository>;
  let mockQueue: jest.Mocked<Queue>;
  let mockLogger: jest.Mocked<AuditLogger>;
  let service: RecoverStaleJobsService;

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

    service = new RecoverStaleJobsService(mockDeliveryRepo, mockQueue, mockLogger, {});
  });

  it('should reset state to scheduled_retry and enqueue backoff job for identified stale deliveries', async () => {
    const delivery = Delivery.restore({
      id: 'del-uuid',
      taskResultId: 'task-123',
      destinationId: 'dest-456',
      status: { kind: 'processing' },
      retryCount: 0,
      nextRetryAt: null,
      createdAt: new Date(),
      updatedAt: new Date(Date.now() - 40 * 1000), // stale
      deletedAt: null,
    });

    mockDeliveryRepo.findStale.mockResolvedValue([delivery]);

    const count = await service.recoverStaleJobs();

    expect(count).toBe(1);
    expect(delivery.getStatus().kind).toBe('scheduled_retry');
    expect(mockQueue.enqueueDelivery).toHaveBeenCalledWith('task-123', 'dest-456', 1, 1000);
    expect(mockDeliveryRepo.save).toHaveBeenCalledWith(delivery);
  });
});
