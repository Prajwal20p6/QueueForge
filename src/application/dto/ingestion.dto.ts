import { z } from 'zod';

/**
 * Request payload for ingesting an AI classification task result.
 */
export interface IngestResultRequest {
  /** RFC 5321 compliant recipient email address identifier */
  emailId: string;
  /** Unique alphanumeric identifier of the executing classification agent */
  agentId: string;
  /** Semantic version string of the agent format (e.g. 1.2.0) */
  agentVersion: string;
  /** Categorized classification parameters and prediction payloads */
  resultPayload: Record<string, any>;
  /** Floating-point precision classification score between 0.0 and 1.0 */
  confidenceScore: number;
  /** Optional telemetry metrics details provided by LLM provider */
  llmMetadata?: {
    model?: string;
    promptHash?: string;
    executionId?: string;
    tokenInput?: number;
    tokenOutput?: number;
    latency?: number;
  };
}

/**
 * Zod validation schema for runtime validation of CreateIngestResultRequest DTOs.
 */
export const CreateIngestResultRequestSchema = z.object({
  emailId: z.string().email(),
  agentId: z.string().min(1).max(255),
  agentVersion: z.string().min(1).max(50),
  resultPayload: z.record(z.any()),
  confidenceScore: z.number().min(0.0).max(1.0),
  llmMetadata: z
    .object({
      model: z.string().optional(),
      promptHash: z.string().optional(),
      executionId: z.string().optional(),
      tokenInput: z.number().nonnegative().optional(),
      tokenOutput: z.number().nonnegative().optional(),
      latency: z.number().nonnegative().optional(),
    })
    .optional(),
});

export type CreateIngestResultRequest = z.infer<typeof CreateIngestResultRequestSchema>;

/**
 * Successful response object returned upon receiving task result payload.
 */
export interface IngestResultResponse {
  /** Unique UUID referencing the stored task result */
  resultId: string;
  /** Pipeline ingestion state status */
  status: 'accepted' | string;
  /** Count of active destinations matched and registered for dispatch */
  deliveryCount?: number;
  /** Count alias for backward compatibility */
  destinationCount?: number;
  /** Timestamp when task result was accepted and enqueued */
  timestamp?: Date;
  /** Timestamp alias for backward compatibility */
  queuedAt?: Date;
}

/**
 * Error response payload structure for ingestion failures.
 */
export interface IngestResultErrorResponse {
  /** Error explanation message */
  error: string;
  /** Detailed error properties or field failures */
  details?: Record<string, any>;
}

export type IngestResultError = IngestResultErrorResponse;
