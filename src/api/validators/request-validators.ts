import { z } from 'zod';
import { IngestResultRequest } from '../../application/dto/ingestion.dto';
import { CreateDestinationRequest, UpdateDestinationRequest } from '../../application/dto/destination.dto';
import { ValidationError } from '../../shared/errors/validation-error';

export interface PaginationParams {
  page: number;
  limit: number;
}

const ingestResultSchema = z.object({
  emailId: z.string().email('Invalid email address format.'),
  agentId: z.string().min(2, 'agentId must be at least 2 characters.').max(64, 'agentId cannot exceed 64 characters.'),
  agentVersion: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/, 'agentVersion must be a valid semantic version string.').optional(),
  confidenceScore: z.number().min(0.0, 'Confidence score must be >= 0.0.').max(1.0, 'Confidence score must be <= 1.0.'),
  resultPayload: z.record(z.any(), { required_error: 'resultPayload must be a non-null object.' }),
  llmMetadata: z.object({
    model: z.string().min(1, 'LLM model must be a non-empty string.').optional(),
    promptHash: z.string().regex(/^[a-fA-F0-9]{64}$/, 'promptHash must be a 64-character SHA-256 hex string.').optional(),
    tokenInput: z.number().nonnegative().optional(),
    tokenOutput: z.number().nonnegative().optional(),
  }).optional(),
});

const createDestinationSchema = z.object({
  name: z.string().min(2, 'Destination name must be at least 2 characters.').optional(),
  type: z.enum(['WEBHOOK', 'DATABASE', 'QUEUE', 'AUDIT'], { invalid_type_error: 'Invalid destination type.' }),
  endpoint: z.string().min(1, 'Endpoint is required.'),
  eventFilters: z.record(z.any()).optional(),
  retryStrategy: z.object({
    type: z.enum(['EXPONENTIAL', 'FIXED', 'LINEAR', 'NONE']).optional(),
    maxRetries: z.number().nonnegative().optional(),
    initialDelayMs: z.number().nonnegative().optional(),
    maxDelayMs: z.number().nonnegative().optional(),
    backoffMultiplier: z.number().positive().optional(),
  }).optional(),
  circuitBreakerThreshold: z.number().min(1).max(100).optional(),
  timeout: z.number().min(100).max(300000).optional(),
  headers: z.record(z.string()).optional(),
  enabled: z.boolean().optional(),
});

const updateDestinationSchema = z.object({
  name: z.string().min(2).optional(),
  endpoint: z.string().min(1).optional(),
  eventFilters: z.record(z.any()).optional(),
  retryStrategy: z.record(z.any()).optional(),
  circuitBreakerThreshold: z.number().min(1).max(100).optional(),
  timeout: z.number().min(100).max(300000).optional(),
  headers: z.record(z.string()).optional(),
  enabled: z.boolean().optional(),
});

const paginationSchema = z.object({
  page: z.string().or(z.number()).transform(val => Math.max(1, parseInt(String(val), 10) || 1)),
  limit: z.string().or(z.number()).transform(val => Math.min(100, Math.max(1, parseInt(String(val), 10) || 20))),
});

/**
 * Zod-backed request validators for QueueForge API DTOs.
 */
export const requestValidators = {
  ingestResult: (body: any): IngestResultRequest => {
    try {
      return ingestResultSchema.parse(body) as IngestResultRequest;
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const first = err.errors[0];
        throw new ValidationError(first.message, { field: first.path.join('.'), errors: err.errors });
      }
      throw err;
    }
  },

  createDestination: (body: any): CreateDestinationRequest => {
    try {
      return createDestinationSchema.parse(body) as CreateDestinationRequest;
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const first = err.errors[0];
        throw new ValidationError(first.message, { field: first.path.join('.'), errors: err.errors });
      }
      throw err;
    }
  },

  updateDestination: (body: any): UpdateDestinationRequest => {
    try {
      return updateDestinationSchema.parse(body) as UpdateDestinationRequest;
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const first = err.errors[0];
        throw new ValidationError(first.message, { field: first.path.join('.'), errors: err.errors });
      }
      throw err;
    }
  },

  paginationParams: (query: any): PaginationParams => {
    try {
      const parsed = paginationSchema.parse(query || {});
      return { page: parsed.page, limit: parsed.limit };
    } catch {
      return { page: 1, limit: 20 };
    }
  },
};
