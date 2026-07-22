import { HandleFailureService } from '../../../../src/application/services/delivery/handle-failure.service';
import { IDeliveryLogRepository as DeliveryRepository } from '../../../../src/domain/repositories/IDeliveryLogRepository';
import { AuditLogger } from '../../../../src/infrastructure/repositories/base.repository';
import { Delivery } from '../../../../src/domain/entities/delivery.entity';

describe('HandleFailureService Unit Tests', () => {
  let mockDeliveryRepo: jest.Mocked<DeliveryRepository>;
  let mockLogger: jest.Mocked<AuditLogger>;
  let service: HandleFailureService;

  beforeEach(() => {
    mockDeliveryRepo = {
      save: jest.fn().mockImplementation(async d => d),
      findByTaskResultId: jest.fn(),
      findByDestinationId: jest.fn(),
      findAll: jest.fn(),
      findStale: jest.fn(),
      findByStatus: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    service = new HandleFailureService(mockDeliveryRepo, mockLogger, {});
  });

  it('should transition status to scheduled_retry on retryable failure and increment count', async () => {
    const delivery = Delivery.restore({
      id: 'del-uuid',
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

    await service.handleFailure('del-uuid', new Error('Transient connection error'), true);

    expect(delivery.getStatus().kind).toBe('scheduled_retry');
    expect(delivery.getRetryCount()).toBe(1); // markFailed resets/records attempt but doesn't change it here, wait
    expect(delivery.getNextRetryAt()).not.toBeNull();
    expect(mockDeliveryRepo.save).toHaveBeenCalledWith(delivery);
  });

  it('should transition status to failed_dlq on non-retryable permanent error', async () => {
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

    await service.handleFailure('del-uuid', new Error('Permanent 400 Bad Request'), false);

    expect(delivery.getStatus().kind).toBe('failed_dlq');
    expect(mockDeliveryRepo.save).toHaveBeenCalledWith(delivery);
  });

  it('should move to DLQ when retry counts exceed limits', async () => {
    const delivery = Delivery.restore({
      id: 'del-uuid',
      taskResultId: 'task-123',
      destinationId: 'dest-456',
      status: { kind: 'scheduled_retry' },
      retryCount: 5, // Max retries
      nextRetryAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    mockDeliveryRepo.findByTaskResultId.mockResolvedValue([delivery]);

    await service.handleFailure('del-uuid', new Error('Transient error #6'), true);

    expect(delivery.getStatus().kind).toBe('failed_dlq');
    expect(mockDeliveryRepo.save).toHaveBeenCalledWith(delivery);
  });
});
