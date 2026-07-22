import { AiTaskResult } from '../../domain/entities/ai-task-result.entity';
import { ITaskResultRepository } from '../../domain/repositories/ITaskResultRepository';
import { IDestinationRepository } from '../../domain/repositories/IDestinationRepository';
import { IQueueService } from '../interfaces/IQueueService';
import { ReceiveTaskResultDTO } from '../dtos/TaskResultDTO';

export class ReceiveTaskResultUseCase {
  constructor(
    private readonly taskResultRepository: ITaskResultRepository,
    private readonly destinationRepository: IDestinationRepository,
    private readonly queueService: IQueueService
  ) {}

  public async execute(dto: ReceiveTaskResultDTO): Promise<AiTaskResult> {
    // 1. Check duplicate task ID
    const existing = await this.taskResultRepository.findById(dto.taskId);
    if (existing) {
      return existing; // Return existing to remain idempotent
    }

    // 2. Create new task result mapping props from payload
    const emailId = dto.payload.emailId || dto.payload.email_id || 'unknown@example.com';
    const agentId = dto.payload.agentId || dto.payload.agent_id || 'unknown-agent';
    const agentVersion = dto.payload.agentVersion || dto.payload.agent_version || '1.0.0';
    const confidenceScore = Number(
      dto.payload.confidenceScore ?? dto.payload.confidence_score ?? 1.0
    );
    const resultPayload = dto.payload.resultPayload || dto.payload.result_payload || dto.payload;

    const taskResult = AiTaskResult.restore({
      id: dto.taskId,
      emailId,
      agentId,
      agentVersion,
      resultPayload,
      confidenceScore,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const savedResult = await this.taskResultRepository.save(taskResult);

    // 3. Find all active destinations
    const activeDestinations = await this.destinationRepository.findAllActive();

    // 4. Enqueue delivery jobs for matching destinations
    for (const destination of activeDestinations) {
      const matchCriteria = {
        agentId: savedResult.getAgentId(),
        emailId: savedResult.getEmailId(),
        confidenceScore: savedResult.getConfidenceScore(),
        ...savedResult.getResultPayload(),
      };
      if (destination.matches(matchCriteria)) {
        await this.queueService.enqueueDelivery(savedResult.getId(), destination.getId(), 1);
      }
    }

    return savedResult;
  }
}
