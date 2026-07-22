import { ITaskResultRepository } from '../../domain/repositories/ITaskResultRepository';
import { AiTaskResult } from '../../domain/entities/ai-task-result.entity';
import { PrismaService } from './prisma.service';

/**
 * Adapter class mapping database records to AiTaskResult domain entities.
 */
export class PrismaTaskResultRepository implements ITaskResultRepository {
  private readonly prisma = PrismaService.getInstance();

  private toDomain(dbRecord: any): AiTaskResult {
    return AiTaskResult.restore({
      id: dbRecord.id,
      emailId: dbRecord.emailId,
      agentId: dbRecord.agentId,
      agentVersion: dbRecord.agentVersion,
      resultPayload: dbRecord.resultPayload as Record<string, any>,
      confidenceScore: dbRecord.confidenceScore,
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt,
      deletedAt: dbRecord.deletedAt,
    });
  }

  public async save(taskResult: AiTaskResult): Promise<AiTaskResult> {
    const record = await this.prisma.aiTaskResult.upsert({
      where: { id: taskResult.getId() },
      update: {
        emailId: taskResult.getEmailId().getValue(),
        agentId: taskResult.getAgentId().getValue(),
        agentVersion: taskResult.getAgentVersion(),
        resultPayload: taskResult.getResultPayload(),
        confidenceScore: taskResult.getConfidenceScore().getValue(),
        updatedAt: new Date(),
        deletedAt: taskResult.isDeleted() ? new Date() : null,
      },
      create: {
        id: taskResult.getId(),
        emailId: taskResult.getEmailId().getValue(),
        agentId: taskResult.getAgentId().getValue(),
        agentVersion: taskResult.getAgentVersion(),
        resultPayload: taskResult.getResultPayload(),
        confidenceScore: taskResult.getConfidenceScore().getValue(),
        createdAt: taskResult.getCreatedAt(),
        updatedAt: new Date(),
        deletedAt: taskResult.isDeleted() ? new Date() : null,
      },
    });
    return this.toDomain(record);
  }

  public async findById(id: string): Promise<AiTaskResult | null> {
    const record = await this.prisma.aiTaskResult.findUnique({
      where: { id },
    });
    return record ? this.toDomain(record) : null;
  }

  public async findByTaskId(taskId: string): Promise<AiTaskResult | null> {
    const record = await this.prisma.aiTaskResult.findUnique({
      where: { id: taskId },
    });
    return record ? this.toDomain(record) : null;
  }

  public async findByIdempotencyKey(_key: string): Promise<AiTaskResult | null> {
    // Idempotency keys are now managed in the Redis cache layer
    return null;
  }

  public async update(taskResult: AiTaskResult): Promise<AiTaskResult> {
    return this.save(taskResult);
  }
}
