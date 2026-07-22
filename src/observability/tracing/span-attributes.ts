/**
 * Operation-specific semantic attribute builder functions for telemetry spans.
 */

export interface IngestionSpanProps {
  emailId: string;
  agentId: string;
  agentVersion: string;
  confidenceScore: number;
  destinationCount?: number;
  llmModel?: string;
  llmTokensInput?: number;
  llmTokensOutput?: number;
  llmLatencyMs?: number;
}

export interface ProcessingSpanProps {
  deliveryId: string;
  destinationId: string;
  destinationType: string;
  attemptNumber: number;
  responseStatus?: number;
  responseTimeMs?: number;
}

export interface RetrySpanProps {
  deliveryId: string;
  retryCount: number;
  backoffMs: number;
  nextRetryAt: Date;
}

export interface RecoverySpanProps {
  jobsRecovered: number;
  durationMs: number;
}

export interface CircuitBreakerSpanProps {
  destinationId: string;
  state: string;
  failureRate?: number;
}

/**
 * Builds attributes for ingestion operations.
 */
export function getIngestionSpanAttributes(props: IngestionSpanProps): Record<string, any> {
  return {
    'operation': 'ingest_result',
    'email_id': props.emailId,
    'agent_id': props.agentId,
    'agent_version': props.agentVersion,
    'confidence_score': props.confidenceScore,
    'destination_count': props.destinationCount ?? 0,
    'llm_model': props.llmModel ?? 'N/A',
    'llm_tokens_input': props.llmTokensInput ?? 0,
    'llm_tokens_output': props.llmTokensOutput ?? 0,
    'llm_latency_ms': props.llmLatencyMs ?? 0,
  };
}

/**
 * Builds attributes for message processing operations.
 */
export function getProcessingSpanAttributes(props: ProcessingSpanProps): Record<string, any> {
  return {
    'operation': 'process_delivery',
    'delivery_id': props.deliveryId,
    'destination_id': props.destinationId,
    'destination_type': props.destinationType,
    'attempt_number': props.attemptNumber,
    'response_status': props.responseStatus ?? 0,
    'response_time_ms': props.responseTimeMs ?? 0,
  };
}

/**
 * Builds attributes for retry scheduling.
 */
export function getRetrySpanAttributes(props: RetrySpanProps): Record<string, any> {
  return {
    'operation': 'schedule_retry',
    'delivery_id': props.deliveryId,
    'retry_count': props.retryCount,
    'backoff_ms': props.backoffMs,
    'next_retry_at': props.nextRetryAt.toISOString(),
  };
}

/**
 * Builds attributes for recovery tasks.
 */
export function getRecoverySpanAttributes(props: RecoverySpanProps): Record<string, any> {
  return {
    'operation': 'recover_stale_jobs',
    'jobs_recovered': props.jobsRecovered,
    'duration_ms': props.durationMs,
  };
}

/**
 * Builds attributes for circuit breaker updates.
 */
export function getCircuitBreakerSpanAttributes(props: CircuitBreakerSpanProps): Record<string, any> {
  return {
    'operation': 'circuit_breaker_check',
    'destination_id': props.destinationId,
    'state': props.state,
    'failure_rate': props.failureRate ?? 0.0,
  };
}
