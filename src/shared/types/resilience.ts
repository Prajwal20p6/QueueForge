/**
 * Status representation of a circuit breaker
 */
export type CircuitBreakerState = 'open' | 'half-open' | 'closed';

/**
 * Timing parameters guiding backoff retry calculations
 */
export interface BackoffConfig {
  baseDelayMs: number;
  maxDelayMs: number;
  factor: number;
  jitter: boolean;
}

/**
 * Policy definition governing retries for network requests and workers
 */
export interface RetryStrategy {
  maxAttempts: number;
  backoff: BackoffConfig;
}
