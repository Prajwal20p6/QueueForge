import { DeliveryResponse } from './delivery.dto';

/**
 * Formatted representation of an AI Task Result.
 */
export interface ResultResponse {
  /** Unique result identifier (UUID) */
  id: string;
  /** Classification agent identifier */
  agentId: string;
  /** Agent semantic version identifier */
  agentVersion?: string;
  /** Confidence score value (0.0 - 1.0) */
  confidenceScore: number;
  /** Categorized classification payload object */
  resultPayload: Record<string, any>;
  /** Timestamp when result was ingested */
  timestamp: Date;
}

/**
 * Individual event in the lineage execution timeline.
 */
export interface TimelineEvent {
  /** Lifecycle event type (e.g. ingested, delivered, failed, retried, dlq) */
  type: string;
  /** Timestamp when event occurred */
  timestamp: Date;
  /** Event details and context object */
  details: Record<string, any>;
}

/**
 * Detailed trace logging the complete processing lifecycle of an email classification result.
 */
export interface LineageResponse {
  /** Target email recipient identifier tracking */
  emailId: string;
  /** List of executing agents and execution timestamps */
  agents: Array<{
    agentId: string;
    agentVersion: string;
    timestamp?: Date;
    createdAt?: Date;
    resultPayload?: any;
    confidenceScore?: number;
  }>;
  /** List of ingested task results */
  results?: ResultResponse[];
  /** List of route destinations and delivery statuses tracing execution */
  deliveries: DeliveryResponse[] | Array<{
    destinationId: string;
    destinationType?: string;
    status: string;
    retryCount: number;
    attempts?: any;
    lastAttemptAt?: Date;
    errorMessage?: string;
  }>;
  /** Chronological event stream of processing steps */
  timeline?: TimelineEvent[];
  /** Calculated totals tracing job processing states */
  summary?: {
    totalAgents: number;
    totalDestinations: number;
    completedCount: number;
    failedCount: number;
    pendingCount: number;
  };
}
