import { ValidateResultService } from '../../../../src/application/services/result/validate-result.service';
import { IngestResultRequest } from '../../../../src/application/dto/ingestion.dto';
import { ValidationError } from '../../../../src/shared/errors/validation-error';
import { AuditLogger } from '../../../../src/infrastructure/repositories/base.repository';

describe('ValidateResultService Unit Tests', () => {
  let mockLogger: jest.Mocked<AuditLogger>;
  let service: ValidateResultService;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    service = new ValidateResultService(mockLogger);
  });

  const validRequest: IngestResultRequest = {
    emailId: 'user@example.com',
    agentId: 'classifier-1',
    agentVersion: '1.2.0',
    resultPayload: { processed: true },
    confidenceScore: 0.95,
  };

  it('should pass validation on valid payload parameters', async () => {
    await expect(service.validate(validRequest)).resolves.not.toThrow();
  });

  it('should throw ValidationError on malformed email address', async () => {
    const request = { ...validRequest, emailId: 'malformed_email' };
    await expect(service.validate(request)).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError on malformed agent ID', async () => {
    const request = { ...validRequest, agentId: 'bad_agent_$$$' };
    await expect(service.validate(request)).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError on malformed agent version', async () => {
    const request = { ...validRequest, agentVersion: 'bad-version' };
    await expect(service.validate(request)).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError on non-object payload values', async () => {
    const request = { ...validRequest, resultPayload: 'not-an-object' as any };
    await expect(service.validate(request)).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError on out-of-bounds confidence score', async () => {
    const request = { ...validRequest, confidenceScore: 1.5 };
    await expect(service.validate(request)).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError on invalid LLM prompt hash values', async () => {
    const request: IngestResultRequest = {
      ...validRequest,
      llmMetadata: {
        model: 'gpt-4',
        promptHash: 'short-hash',
        executionId: 'exec-123',
        tokenInput: 10,
        tokenOutput: 5,
        latency: 100,
      },
    };
    await expect(service.validate(request)).rejects.toThrow(ValidationError);
  });
});
