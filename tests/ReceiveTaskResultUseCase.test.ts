import { ReceiveTaskResultUseCase } from '../src/application/use-cases/ReceiveTaskResultUseCase';
import { ITaskResultRepository } from '../src/domain/repositories/ITaskResultRepository';
import { IDestinationRepository } from '../src/domain/repositories/IDestinationRepository';
import { IQueueService } from '../src/application/interfaces/IQueueService';
import { AiTaskResult } from '../src/domain/entities/ai-task-result.entity';
import { Destination } from '../src/domain/entities/destination.entity';
import { DestinationType } from '../src/domain/value-objects/destination-type';

describe('ReceiveTaskResultUseCase', () => {
  let useCase: ReceiveTaskResultUseCase;
  let taskResultRepository: jest.Mocked<ITaskResultRepository>;
  let destinationRepository: jest.Mocked<IDestinationRepository>;
  let queueService: jest.Mocked<IQueueService>;

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

    queueService = {
      enqueueDelivery: jest.fn(),
    };

    useCase = new ReceiveTaskResultUseCase(
      taskResultRepository,
      destinationRepository,
      queueService
    );
  });

  it('should save task result and enqueue delivery jobs for active destinations', async () => {
    const dto = {
      taskId: 'task-abc',
      payload: {
        emailId: 'user@example.com',
        agentId: 'ai-classifier',
        agentVersion: '1.2.0',
        confidenceScore: 0.95,
        resultPayload: { foo: 'bar' },
      },
    };

    taskResultRepository.findById.mockResolvedValue(null);
    taskResultRepository.save.mockImplementation(async tr => tr);

    const mockDest = Destination.restore({
      id: 'dest-999',
      endpointUrl: 'http://localhost:8080/webhook',
      destinationType: DestinationType.webhook(),
      eventFilters: { agentId: 'ai-classifier' },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    destinationRepository.findAllActive.mockResolvedValue([mockDest]);

    const result = await useCase.execute(dto);

    expect(result.getId()).toBe('task-abc');
    expect(result.getEmailId()).toBe('user@example.com');
    expect(result.getAgentId()).toBe('ai-classifier');
    expect(taskResultRepository.save).toHaveBeenCalledTimes(1);
    expect(destinationRepository.findAllActive).toHaveBeenCalledTimes(1);
    expect(queueService.enqueueDelivery).toHaveBeenCalledWith(result.getId(), 'dest-999', 1);
  });

  it('should bypass saving and return existing result if ID already exists', async () => {
    const existing = AiTaskResult.restore({
      id: 'task-abc',
      emailId: 'user@example.com',
      agentId: 'ai-classifier',
      agentVersion: '1.2.0',
      resultPayload: { foo: 'bar' },
      confidenceScore: 0.95,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    taskResultRepository.findById.mockResolvedValue(existing);

    const dto = {
      taskId: 'task-abc',
      payload: { hello: 'world' },
    };

    const result = await useCase.execute(dto);

    expect(result).toBe(existing);
    expect(taskResultRepository.save).not.toHaveBeenCalled();
    expect(queueService.enqueueDelivery).not.toHaveBeenCalled();
  });
});
