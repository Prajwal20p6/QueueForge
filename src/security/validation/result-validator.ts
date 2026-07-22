import { InputValidator } from './validators';
import { IngestResultRequest } from '../../application/dto/ingestion.dto';
import { ValidationError } from '../../shared/errors/validation-error';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

/**
 * Security validator asserting rules and constraints on AI task result ingestion payloads.
 */
export class ResultValidator {
  constructor(_logger?: Logger | any) {}

  /**
   * Asserts valid email address format.
   */
  public validateEmailId(email: string): void {
    InputValidator.validateEmail(email);
  }

  /**
   * Asserts valid agentId format (alphanumeric, hyphens, underscores).
   */
  public validateAgentId(agentId: string): void {
    if (!agentId || typeof agentId !== 'string') {
      throw new ValidationError('agentId', 'Field "agentId" is required.');
    }
    const pattern = /^[a-zA-Z0-9_\-.:]{2,64}$/;
    if (!pattern.test(agentId.trim())) {
      throw new ValidationError('agentId', `Invalid agentId format: "${agentId}". Must be 2-64 alphanumeric characters.`);
    }
  }

  /**
   * Asserts confidence score is within valid bounds [0.0, 1.0].
   */
  public validateConfidenceScore(score: number): void {
    if (score === undefined || score === null || typeof score !== 'number' || isNaN(score)) {
      throw new ValidationError('confidenceScore', 'Confidence score is required and must be a number.');
    }
    if (score < 0 || score > 1) {
      throw new ValidationError('confidenceScore', `Confidence score must be between 0.0 and 1.0. Received: ${score}`);
    }
  }

  /**
   * Asserts resultPayload is a valid object and within maximum byte size limit (<10MB).
   */
  public validatePayload(payload: Record<string, any>, maxSizeBytes: number = 10 * 1024 * 1024): void {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new ValidationError('resultPayload', 'Result payload must be a non-null JSON object.');
    }

    const payloadString = JSON.stringify(payload);
    const byteSize = Buffer.byteLength(payloadString, 'utf8');

    if (byteSize > maxSizeBytes) {
      throw new ValidationError('resultPayload', `Result payload size (${(byteSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum ${maxSizeBytes / 1024 / 1024}MB limit.`);
    }
  }

  /**
   * Asserts LLM metadata properties formatting if present.
   */
  public validateLLMMetadata(metadata: Record<string, any>): void {
    if (!metadata || typeof metadata !== 'object') {
      throw new ValidationError('llmMetadata', 'LLM metadata must be an object.');
    }

    if (metadata.model !== undefined && (typeof metadata.model !== 'string' || !metadata.model.trim())) {
      throw new ValidationError('llmMetadata.model', 'LLM model must be a non-empty string.');
    }

    if (metadata.promptHash !== undefined) {
      const hashPattern = /^[a-fA-F0-9]{64}$/;
      if (typeof metadata.promptHash !== 'string' || !hashPattern.test(metadata.promptHash)) {
        throw new ValidationError('llmMetadata.promptHash', 'LLM prompt hash must be a 64-character hex SHA-256 string.');
      }
    }

    if (metadata.tokenInput !== undefined && (typeof metadata.tokenInput !== 'number' || metadata.tokenInput < 0)) {
      throw new ValidationError('llmMetadata.tokenInput', 'tokenInput must be a non-negative integer.');
    }

    if (metadata.tokenOutput !== undefined && (typeof metadata.tokenOutput !== 'number' || metadata.tokenOutput < 0)) {
      throw new ValidationError('llmMetadata.tokenOutput', 'tokenOutput must be a non-negative integer.');
    }
  }

  /**
   * Validates full IngestResultRequest body throwing ValidationError on any breach.
   */
  public validateIngestRequest(request: any): IngestResultRequest {
    if (!request || typeof request !== 'object') {
      throw new ValidationError('request', 'Ingest request body is required.');
    }

    this.validateEmailId(request.emailId);
    this.validateAgentId(request.agentId);

    if (request.agentVersion) {
      const semverPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
      if (!semverPattern.test(request.agentVersion)) {
        throw new ValidationError('agentVersion', 'agentVersion must be a valid semantic version string.');
      }
    }

    this.validateConfidenceScore(request.confidenceScore);
    this.validatePayload(request.resultPayload);

    if (request.llmMetadata) {
      this.validateLLMMetadata(request.llmMetadata);
    }

    return request as IngestResultRequest;
  }
}
