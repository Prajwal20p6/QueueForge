import { DeliverTaskResultUseCase } from '../src/application/use-cases/DeliverTaskResultUseCase';
import { ITaskResultRepository } from '../src/domain/repositories/ITaskResultRepository';
import { IDestinationRepository } from '../src/domain/repositories/IDestinationRepository';
import { IDeliveryLogRepository } from '../src/domain/repositories/IDeliveryLogRepository';
import { IHttpClient } from '../src/application/interfaces/IHttpClient';
import { AiTaskResult } from '../src/domain/entities/ai-task-result.entity';
import { Destination } from '../src/domain/entities/destination.entity';
import { DestinationType } from '../src/domain/value-objects/destination-type';
import { Delivery } from '../src/domain/entities/delivery.entity';

describe('DeliverTaskResultUseCase', () => {
  let useCase: DeliverTaskResultUseCase;
  let taskResultRepository: jest.Mocked<ITaskResultRepository>;
  let destinationRepository: jest.Mocked<IDestinationRepository>;
  let deliveryLogRepository: jest.Mocked<IDeliveryLogRepository>;
  let httpClient: jest.Mocked<IHttpClient>;

  beforeEach(() => {
    taskResultRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByTaskId: jest.fn(),
      findByIdempotencyKey: jest.fn(),
      update: jest.fn(),
    } as any;

    destinationRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllActive: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    } as any;

    deliveryLogRepository = {
      save: jest.fn(),
      findByTaskResultId: jest.fn(),
      findByDestinationId: jest.fn(),
    } as any;

    httpClient = {
      post: jest.fn(),
    };

    useCase = new DeliverTaskResultUseCase(
      taskResultRepository,
      destinationRepository,
      deliveryLogRepository,
      httpClient
    );
  });

  it('should successfully deliver task result, generate signature, and log SUCCESS', async () => {
    const taskResult = AiTaskResult.restore({
      id: 'tr-1',
      emailId: 'user@example.com',
      agentId: 'ai-classifier',
      agentVersion: '1.2.0',
      resultPayload: { data: 'my-payload' },
      confidenceScore: 0.85,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const destination = Destination.restore({
      id: 'dest-1',
      endpointUrl: 'http://localhost:8080/webhook',
      destinationType: DestinationType.webhook(),
      eventFilters: { hmacSecret: 'supersecret' },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    taskResultRepository.findById.mockResolvedValue(taskResult);
    destinationRepository.findById.mockResolvedValue(destination);
    httpClient.post.mockResolvedValue({
      status: 200,
      data: { success: true },
      durationMs: 150,
    });

    await useCase.execute('tr-1', 'dest-1', 1);

    expect(httpClient.post).toHaveBeenCalledWith(
      'http://localhost:8080/webhook',
      { data: 'my-payload' },
      expect.objectContaining({
        'X-QueueForge-Task-Id': 'tr-1',
        'X-QueueForge-Attempt': '1',
        'X-QueueForge-Signature': expect.any(String),
      }),
      5000
    );

    expect(deliveryLogRepository.save).toHaveBeenCalledWith(expect.any(Delivery));

    const savedDelivery = deliveryLogRepository.save.mock.calls[0][0] as Delivery;
    expect(savedDelivery.getStatus().kind).toBe('completed');
    expect(savedDelivery.getRetryCount()).toBe(1);
  });

  it('should log FAILED attempt and throw error when network times out', async () => {
    const taskResult = AiTaskResult.restore({
      id: 'tr-1',
      emailId: 'user@example.com',
      agentId: 'ai-classifier',
      agentVersion: '1.2.0',
      resultPayload: { data: 'my-payload' },
      confidenceScore: 0.85,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const destination = Destination.restore({
      id: 'dest-1',
      endpointUrl: 'http://localhost:8080/webhook',
      destinationType: DestinationType.webhook(),
      eventFilters: {},
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    taskResultRepository.findById.mockResolvedValue(taskResult);
    destinationRepository.findById.mockResolvedValue(destination);
    httpClient.post.mockRejectedValue(new Error('Connection timed out'));

    await expect(useCase.execute('tr-1', 'dest-1', 1, 5)).rejects.toThrow(
      'Delivery attempt 1 failed. Error: Connection timed out'
    );

    expect(deliveryLogRepository.save).toHaveBeenCalledWith(expect.any(Delivery));

    const savedDelivery = deliveryLogRepository.save.mock.calls[0][0] as Delivery;
    expect(savedDelivery.getStatus().kind).toBe('scheduled_retry');
    expect(savedDelivery.getNextRetryAt()).toBeInstanceOf(Date);
  });

  it('should update status to FAILED (DLQ) if attempt reaches maximum allowed retries', async () => {
    const taskResult = AiTaskResult.restore({
      id: 'tr-1',
      emailId: 'user@example.com',
      agentId: 'ai-classifier',
      agentVersion: '1.2.0',
      resultPayload: { data: 'my-payload' },
      confidenceScore: 0.85,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const destination = Destination.restore({
      id: 'dest-1',
      endpointUrl: 'http://localhost:8080/webhook',
      destinationType: DestinationType.webhook(),
      eventFilters: {},
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    taskResultRepository.findById.mockResolvedValue(taskResult);
    destinationRepository.findById.mockResolvedValue(destination);
    httpClient.post.mockRejectedValue(new Error('Server Error 500'));

    await expect(useCase.execute('tr-1', 'dest-1', 5, 5)).rejects.toThrow(
      /Permanent failure \(DLQ\)/
    );

    expect(deliveryLogRepository.save).toHaveBeenCalledWith(expect.any(Delivery));

    const savedDelivery = deliveryLogRepository.save.mock.calls[0][0] as Delivery;
    expect(savedDelivery.getStatus().kind).toBe('failed_dlq');
  });
});
