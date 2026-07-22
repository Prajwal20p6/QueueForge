import { IngestResultService } from '../../../../src/application/services/result/ingest-result.service';
import { ITaskResultRepository as ResultRepository } from '../../../../src/domain/repositories/ITaskResultRepository';
import { IDeliveryLogRepository as DeliveryRepository } from '../../../../src/domain/repositories/IDeliveryLogRepository';
import { IDestinationRepository as DestinationRepository } from '../../../../src/domain/repositories/IDestinationRepository';
import { IQueueService as Queue } from '../../../../src/application/interfaces/IQueueService';
import { IdempotencyCache } from '../../../../src/infrastructure/cache/idempotency-cache';
import { AuditLogger } from '../../../../src/infrastructure/repositories/base.repository';
import { Destination } from '../../../../src/domain/entities/destination.entity';
import { DestinationType } from '../../../../src/domain/value-objects/destination-type';
import { AiTaskResult } from '../../../../src/domain/entities/ai-task-result.entity';
import { Delivery } from '../../../../src/domain/entities/delivery.entity';

describe('IngestResultService Unit Tests', () => {
  let mockResultRepo: jest.Mocked<ResultRepository>;
  let mockDeliveryRepo: jest.Mocked<DeliveryRepository>;
  let mockDestRepo: jest.Mocked<DestinationRepository>;
  let mockQueue: jest.Mocked<Queue>;
  let mockCache: jest.Mocked<IdempotencyCache>;
  let mockLogger: jest.Mocked<AuditLogger>;
  let service: IngestResultService;

  beforeEach(() => {
    mockResultRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByTaskId: jest.fn(),
      findByIdempotencyKey: jest.fn(),
      update: jest.fn(),
    } as any;

    mockDeliveryRepo = {
      save: jest.fn(),
      findByTaskResultId: jest.fn(),
      findByDestinationId: jest.fn(),
      findAll: jest.fn(),
      findStale: jest.fn(),
      findByStatus: jest.fn(),
    };

    mockDestRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllActive: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    } as any;

    mockQueue = {
      enqueueDelivery: jest.fn(),
    };

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      exists: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    service = new IngestResultService(
      mockResultRepo,
      mockDeliveryRepo,
      mockDestRepo,
      mockQueue,
      mockCache,
      mockLogger
    );
  });

  it('should successfully ingest AI result, match destinations, and enqueue delivery jobs', async () => {
    const request = {
      emailId: 'user@example.com',
      agentId: 'classifier-1',
      agentVersion: '1.0.0',
      resultPayload: { category: 'invoices', value: 100 },
      confidenceScore: 0.95,
    };

    mockCache.get.mockResolvedValue(null);

    const dest = Destination.restore({
      id: 'dest-1',
      endpointUrl: 'https://webhook.site/abc',
      destinationType: DestinationType.webhook(),
      eventFilters: { category: 'invoices' },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    mockDestRepo.findAllActive.mockResolvedValue([dest]);

    const res = await service.ingest(request);

    expect(res.status).toBe('accepted');
    expect(res.destinationCount).toBe(1);

    expect(mockResultRepo.save).toHaveBeenCalledWith(expect.any(AiTaskResult));
    expect(mockDeliveryRepo.save).toHaveBeenCalledWith(expect.any(Delivery));
    expect(mockQueue.enqueueDelivery).toHaveBeenCalledWith(res.resultId, 'dest-1', 1);
    expect(mockCache.set).toHaveBeenCalled();
  });

  it('should return cached result ID on duplicate idempotency key hit', async () => {
    const request = {
      emailId: 'user@example.com',
      agentId: 'classifier-1',
      agentVersion: '1.0.0',
      resultPayload: { category: 'invoices' },
      confidenceScore: 0.95,
    };

    mockCache.get.mockResolvedValue({
      value: {
        resultId: 'cached-uuid-123',
        status: 'accepted',
        queuedAt: new Date(),
        destinationCount: 2,
      },
      expiresAt: new Date(),
    });

    const res = await service.ingest(request);
    expect(res.resultId).toBe('cached-uuid-123');
    expect(mockResultRepo.save).not.toHaveBeenCalled();
    expect(mockQueue.enqueueDelivery).not.toHaveBeenCalled();
  });
});
