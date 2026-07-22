import { EmailId } from '../../domain/value-objects/email-id.vo';
import { AgentId } from '../../domain/value-objects/agent-id.vo';
import { ConfidenceScore } from '../../domain/value-objects/confidence-score.vo';
import { ValidationError } from '../../shared/errors/validation-error';
import { IngestResultRequest } from '../dto/ingestion.dto';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

/**
 * Service validating AI ingestion request parameters, payload sizes, and LLM telemetry formatting.
 */
export class ValidateResultService {
  constructor(private readonly logger?: Logger | any) {}

  /**
   * Asserts request formatting complies with rules, returning the validated request object.
   */
  public async validateRequest(request: any): Promise<IngestResultRequest> {
    if (!request) {
      throw new ValidationError('Request body is required.');
    }

    // Check required fields
    if (!request.emailId) throw new ValidationError('emailId', 'Field "emailId" is required.');
    if (!request.agentId) throw new ValidationError('agentId', 'Field "agentId" is required.');
    if (request.confidenceScore === undefined || request.confidenceScore === null) {
      throw new ValidationError('confidenceScore', 'Field "confidenceScore" is required.');
    }
    if (!request.resultPayload) throw new ValidationError('resultPayload', 'Field "resultPayload" is required.');

    // 1. Email ID validation
    try {
      EmailId.create(request.emailId);
    } catch (err: any) {
      throw new ValidationError('emailId', `Invalid email format: ${err.message}`);
    }

    // 2. Agent ID validation
    try {
      AgentId.create(request.agentId);
    } catch (err: any) {
      throw new ValidationError('agentId', `Invalid agent ID format: ${err.message}`);
    }

    // 3. Agent Version validation
    if (!request.agentVersion || !/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(request.agentVersion)) {
      throw new ValidationError('agentVersion', 'Agent version must be a valid semantic version string.');
    }

    // 4. Confidence Score validation
    try {
      ConfidenceScore.create(request.confidenceScore);
    } catch (err: any) {
      throw new ValidationError('confidenceScore', `Invalid confidence score: ${err.message}`);
    }

    // 5. Result Payload validation
    this.validatePayload(request.resultPayload);

    // 6. LLM Metadata validation (if present)
    if (request.llmMetadata) {
      this.validateLLMMetadata(request.llmMetadata);
    }

    return request as IngestResultRequest;
  }

  /**
   * Asserts validity of resultPayload structure and size constraints (< 10MB).
   */
  public validatePayload(payload: Record<string, any>): void {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new ValidationError('resultPayload', 'Result payload must be a valid JSON object.');
    }

    const payloadString = JSON.stringify(payload);
    const byteSize = Buffer.byteLength(payloadString, 'utf8');
    const maxByteSize = 10 * 1024 * 1024; // 10MB limit

    if (byteSize > maxByteSize) {
      throw new ValidationError('resultPayload', `Result payload size (${(byteSize / 1024 / 1024).toFixed(2)}MB) exceeds 10MB limit.`);
    }
  }

  /**
   * Asserts validity of LLM provider metadata telemetry properties.
   */
  public validateLLMMetadata(metadata: Record<string, any>): void {
    if (!metadata || typeof metadata !== 'object') {
      throw new ValidationError('llmMetadata', 'LLM metadata must be an object.');
    }

    if (metadata.model !== undefined && (typeof metadata.model !== 'string' || !metadata.model.trim())) {
      throw new ValidationError('llmMetadata.model', 'LLM model must be a non-empty string.');
    }

    if (metadata.promptHash !== undefined && !/^[a-fA-F0-9]{64}$/.test(metadata.promptHash)) {
      throw new ValidationError('llmMetadata.promptHash', 'LLM prompt hash must be a valid SHA-256 string.');
    }

    if (metadata.tokenInput !== undefined && (typeof metadata.tokenInput !== 'number' || metadata.tokenInput < 0)) {
      throw new ValidationError('llmMetadata.tokenInput', 'LLM tokenInput must be a non-negative integer.');
    }

    if (metadata.tokenOutput !== undefined && (typeof metadata.tokenOutput !== 'number' || metadata.tokenOutput < 0)) {
      throw new ValidationError('llmMetadata.tokenOutput', 'LLM tokenOutput must be a non-negative integer.');
    }

    if (metadata.latency !== undefined && (typeof metadata.latency !== 'number' || metadata.latency < 0)) {
      throw new ValidationError('llmMetadata.latency', 'LLM latency must be a non-negative number.');
    }
  }

  /**
   * Convenience alias method asserting request formatting complies with rules.
   */
  public async validate(request: IngestResultRequest): Promise<void> {
    this.logger?.debug?.(`Validating ingestion payload for email: ${request?.emailId}`);
    await this.validateRequest(request);
  }
}
