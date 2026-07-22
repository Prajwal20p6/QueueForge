import { AiTaskResult } from '../../domain/entities/ai-task-result.entity';
import { IngestResultRequest } from '../dto/ingestion.dto';
import { ResultResponse } from '../dto/lineage.dto';
import { ValidationError } from '../../shared/errors/validation-error';

/**
 * Mapper converting ingestion DTOs to/from AiTaskResult domain entities.
 */
export class ResultMapper {
  /**
   * Instantiates a new AiTaskResult entity using parameter validation checks.
   */
  public static toDomain(dto: IngestResultRequest): AiTaskResult {
    if (!dto) {
      throw new ValidationError('Request payload parameters are missing.');
    }

    try {
      return AiTaskResult.create({
        emailId: dto.emailId,
        agentId: dto.agentId,
        agentVersion: dto.agentVersion,
        resultPayload: dto.resultPayload,
        confidenceScore: dto.confidenceScore,
        metadata: dto.llmMetadata,
      });
    } catch (err: any) {
      throw new ValidationError(err.message || 'Failed mapping ingestion payload properties.', err.context || err);
    }
  }

  /**
   * Alias method for backward compatibility.
   */
  public static toDomainEntity(dto: IngestResultRequest): AiTaskResult {
    return ResultMapper.toDomain(dto);
  }

  /**
   * Serializes an AiTaskResult entity into a clean response object.
   */
  public static toResponse(entity: AiTaskResult): ResultResponse & Record<string, any> {
    if (!entity) {
      throw new ValidationError('Cannot map null or undefined AiTaskResult entity to response.');
    }

    const emailStr = typeof entity.getEmailId === 'function' && typeof entity.getEmailId() === 'object' && entity.getEmailId() !== null
      ? (entity.getEmailId().getValue?.() || String(entity.getEmailId()))
      : String(entity.getEmailId?.() || '');

    const agentStr = typeof entity.getAgentId === 'function' && typeof entity.getAgentId() === 'object' && entity.getAgentId() !== null
      ? (entity.getAgentId().getValue?.() || String(entity.getAgentId()))
      : String(entity.getAgentId?.() || '');

    const confidenceNum = typeof entity.getConfidenceScore === 'function' && typeof entity.getConfidenceScore() === 'object' && entity.getConfidenceScore() !== null
      ? (entity.getConfidenceScore().getValue?.() || Number(entity.getConfidenceScore()))
      : Number(entity.getConfidenceScore?.() || 0);

    return {
      id: entity.getId(),
      resultId: entity.getId(),
      emailId: emailStr,
      agentId: agentStr,
      agentVersion: entity.getAgentVersion(),
      confidenceScore: confidenceNum,
      resultPayload: entity.getResultPayload(),
      timestamp: entity.getCreatedAt(),
      createdAt: entity.getCreatedAt(),
    };
  }

  /**
   * Serializes an AiTaskResult entity into a lineage item format.
   */
  public static toLineageResponse(entity: AiTaskResult): ResultResponse {
    return ResultMapper.toResponse(entity);
  }

  /**
   * Alias method for backward compatibility.
   */
  public static toLineageItem(entity: AiTaskResult): any {
    return ResultMapper.toResponse(entity);
  }

  /**
   * Serializes an AiTaskResult entity into a raw generic DTO object.
   */
  public static toDTO(entity: AiTaskResult): Record<string, any> {
    if (!entity) {
      throw new ValidationError('Cannot map null or undefined AiTaskResult entity to DTO.');
    }

    return {
      id: entity.getId(),
      emailId: String(entity.getEmailId?.() || ''),
      agentId: String(entity.getAgentId?.() || ''),
      agentVersion: entity.getAgentVersion(),
      confidenceScore: Number(entity.getConfidenceScore?.() || 0),
      resultPayload: entity.getResultPayload(),
      llmMetadata: entity.getMetadata() || {},
      createdAt: entity.getCreatedAt(),
      updatedAt: entity.getUpdatedAt(),
    };
  }
}
