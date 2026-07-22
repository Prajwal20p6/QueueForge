import { ResultMapper } from '../../../../src/application/mappers/result-mapper';
import { IngestResultRequest } from '../../../../src/application/dto/ingestion.dto';
import { AiTaskResult } from '../../../../src/domain/entities/ai-task-result.entity';
import { ValidationError } from '../../../../src/shared/errors/validation-error';

describe('ResultMapper Unit Tests', () => {
  const validRequest: IngestResultRequest = {
    emailId: 'user@example.com',
    agentId: 'classifier-1',
    agentVersion: '1.0.0',
    resultPayload: { processed: true },
    confidenceScore: 0.95,
  };

  it('should map valid IngestResultRequest to AiTaskResult domain entity', () => {
    const entity = ResultMapper.toDomainEntity(validRequest);

    expect(entity).toBeInstanceOf(AiTaskResult);
    expect(entity.getEmailId()).toBe('user@example.com');
    expect(entity.getAgentId()).toBe('classifier-1');
    expect(entity.getResultPayload()).toEqual({ processed: true });
    expect(entity.getConfidenceScore()).toBe(0.95);
  });

  it('should throw ValidationError if mapping fails due to invalid parameters', () => {
    const invalidRequest = { ...validRequest, emailId: 'malformed_email' };
    expect(() => ResultMapper.toDomainEntity(invalidRequest)).toThrow(ValidationError);
  });

  it('should map AiTaskResult to response object', () => {
    const entity = AiTaskResult.restore({
      id: 'result-uuid',
      emailId: 'user@example.com',
      agentId: 'classifier-1',
      agentVersion: '1.0.0',
      resultPayload: { processed: true },
      confidenceScore: 0.95,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const response = ResultMapper.toResponse(entity);
    expect(response.resultId).toBe('result-uuid');
    expect(response.emailId).toBe('user@example.com');
    expect(response.confidenceScore).toBe(0.95);
  });

  it('should map AiTaskResult to lineage item object', () => {
    const entity = AiTaskResult.restore({
      id: 'result-uuid',
      emailId: 'user@example.com',
      agentId: 'classifier-1',
      agentVersion: '1.0.0',
      resultPayload: { processed: true },
      confidenceScore: 0.95,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const lineage = ResultMapper.toLineageItem(entity);
    expect(lineage.agentId).toBe('classifier-1');
    expect(lineage.resultPayload).toEqual({ processed: true });
  });
});
