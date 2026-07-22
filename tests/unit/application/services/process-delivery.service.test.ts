import { ProcessDeliveryService } from '../../../../src/application/services/delivery/process-delivery.service';
import { IDeliveryLogRepository as DeliveryRepository } from '../../../../src/domain/repositories/IDeliveryLogRepository';
import { IDestinationRepository as DestinationRepository } from '../../../../src/domain/repositories/IDestinationRepository';
import { ITaskResultRepository as ResultRepository } from '../../../../src/domain/repositories/ITaskResultRepository';
import { AttemptRepository } from '../../../../src/infrastructure/repositories/attempt.repository';
import { IHttpClient } from '../../../../src/application/interfaces/IHttpClient';
import { AuditLogger } from '../../../../src/infrastructure/repositories/base.repository';
import { Destination } from '../../../../src/domain/entities/destination.entity';
import { DestinationType } from '../../../../src/domain/value-objects/destination-type';
import { Delivery } from '../../../../src/domain/entities/delivery.entity';
import { AiTaskResult } from '../../../../src/domain/entities/ai-task-result.entity';

describe('ProcessDeliveryService Unit Tests', () => {
  let mockDeliveryRepo: jest.Mocked<DeliveryRepository>;
  let mockDestRepo: jest.Mocked<DestinationRepository>;
  let mockAttemptRepo: jest.Mocked<AttemptRepository>;
  let mockResultRepo: jest.Mocked<ResultRepository>;
  let mockHttpClient: jest.Mocked<IHttpClient>;
  let mockLogger: jest.Mocked<AuditLogger>;
  let service: ProcessDeliveryService;

  beforeEach(() => {
    mockDeliveryRepo = {
      save: jest.fn().mockImplementation(async d => d),
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

    mockAttemptRepo = {
      recordAttempt: jest.fn(),
    } as any;

    mockResultRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByTaskId: jest.fn(),
      findByIdempotencyKey: jest.fn(),
      update: jest.fn(),
    } as any;

    mockHttpClient = {
      post: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    service = new ProcessDeliveryService(
      mockDeliveryRepo,
      mockDestRepo,
      mockAttemptRepo,
      mockLogger,
      {},
      {},
      mockResultRepo,
      mockHttpClient
    );
  });

  it('should successfully execute webhook POST and transition delivery state to completed', async () => {
    const deliveryId = 'del-uuid-123';
    const delivery = Delivery.restore({
      id: deliveryId,
      taskResultId: 'task-123',
      destinationId: 'dest-456',
      status: { kind: 'pending' },
      retryCount: 0,
      nextRetryAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const dest = Destination.restore({
      id: 'dest-456',
      endpointUrl: 'https://webhook.site/abc',
      destinationType: DestinationType.webhook(),
      eventFilters: {},
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const taskResult = AiTaskResult.restore({
      id: 'task-123',
      emailId: 'user@example.com',
      agentId: 'classifier-1',
      agentVersion: '1.0.0',
      resultPayload: { category: 'invoices' },
      confidenceScore: 0.95,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    mockDeliveryRepo.findByTaskResultId.mockResolvedValue([delivery]);
    mockResultRepo.findById.mockResolvedValue(taskResult);
    mockHttpClient.post.mockResolvedValue({
      status: 200,
      data: { success: true },
      durationMs: 80,
    });

    const res = await service.processDelivery(deliveryId, dest);

    expect(res.status).toBe('completed');
    expect(mockHttpClient.post).toHaveBeenCalledWith(
      'https://webhook.site/abc',
      { category: 'invoices' },
      expect.objectContaining({
        'X-QueueForge-Delivery-Id': deliveryId,
        'X-QueueForge-Attempt': '1',
      }),
      30000
    );

    expect(mockAttemptRepo.recordAttempt).toHaveBeenCalledWith(deliveryId, 1, {
      responseStatus: 200,
      responseTimeMs: 80,
      errorMessage: null,
    });
  });

  it('should log failure attempt details and transition status to scheduled_retry on transient errors', async () => {
    const deliveryId = 'del-uuid-123';
    const delivery = Delivery.restore({
      id: deliveryId,
      taskResultId: 'task-123',
      destinationId: 'dest-456',
      status: { kind: 'pending' },
      retryCount: 0,
      nextRetryAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const dest = Destination.restore({
      id: 'dest-456',
      endpointUrl: 'https://webhook.site/abc',
      destinationType: DestinationType.webhook(),
      eventFilters: {},
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const taskResult = AiTaskResult.restore({
      id: 'task-123',
      emailId: 'user@example.com',
      agentId: 'classifier-1',
      agentVersion: '1.0.0',
      resultPayload: { category: 'invoices' },
      confidenceScore: 0.95,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    mockDeliveryRepo.findByTaskResultId.mockResolvedValue([delivery]);
    mockResultRepo.findById.mockResolvedValue(taskResult);
    mockHttpClient.post.mockRejectedValue({
      message: 'Connection Timeout',
      status: 408,
    });

    const res = await service.processDelivery(deliveryId, dest);

    expect(res.status).toBe('scheduled_retry');
    expect(mockAttemptRepo.recordAttempt).toHaveBeenCalledWith(deliveryId, 1, {
      responseStatus: 408,
      responseTimeMs: expect.any(Number),
      errorMessage: 'Connection Timeout',
    });
  });
});
