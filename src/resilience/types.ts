import { CircuitBreakerManager } from './circuit-breaker';
import { BulkheadManager } from './bulkhead';
import { BackpressureHandler } from './backpressure';
import { RetryEngine } from './retry';

export { CircuitState, CircuitBreakerState } from './circuit-breaker/circuit-breaker-state';

/**
 * Metric stats auditing current queue depth pressure levels.
 */
export interface BackpressureStatus {
  isUnderPressure: boolean;
  depth: number;
  threshold: number;
  strategy: string;
}

/**
 * Categorized alarm stages tracing pipeline capacities.
 */
export type AlarmLevel = 'GREEN' | 'YELLOW' | 'RED' | 'CRITICAL';

/**
 * Error thrown when a bulkhead worker pool lacks free slots.
 */
export class PoolExhaustedError extends Error {
  constructor(poolName: string) {
    super(`Bulkhead worker pool "${poolName}" has exhausted all available concurrency slots`);
    this.name = 'PoolExhaustedError';
    Object.setPrototypeOf(this, PoolExhaustedError.prototype);
  }
}

/**
 * Aggregated resilience managers context mapping instances.
 */
export interface ResilienceContext {
  circuitBreaker: CircuitBreakerManager;
  bulkhead: BulkheadManager;
  backpressure: BackpressureHandler;
  retry: RetryEngine;
}
