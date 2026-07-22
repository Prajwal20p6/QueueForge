import { JobStatus } from '../types/queue';
import { CircuitBreakerState } from '../types/resilience';

/**
 * Checks if a BullMQ job status is 'completed'
 */
export function isJobCompleted(status: JobStatus): boolean {
  return status === 'completed';
}

/**
 * Checks if a BullMQ job status represents a 'failed' terminal state
 */
export function isJobFailed(status: JobStatus): boolean {
  return status === 'failed';
}

/**
 * Checks if a BullMQ job is still active or waiting in queue
 */
export function isJobPending(status: JobStatus): boolean {
  return status === 'waiting' || status === 'active';
}

/**
 * Checks if a BullMQ job is sitting in backoff delay state
 */
export function isJobScheduledRetry(status: JobStatus): boolean {
  return status === 'delayed';
}

/**
 * Checks if a job status has landed in Dead Letter status
 */
export function isJobInDLQ(status: JobStatus): boolean {
  return status === 'failed';
}

/**
 * Checks if a circuit breaker is in the 'open' state
 */
export function isCircuitOpen(state: CircuitBreakerState): boolean {
  return state === 'open';
}

/**
 * Checks if a circuit breaker is in the 'half-open' state
 */
export function isCircuitHalfOpen(state: CircuitBreakerState): boolean {
  return state === 'half-open';
}
