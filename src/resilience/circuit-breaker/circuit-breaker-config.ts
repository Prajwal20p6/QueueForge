/**
 * Configuration options governing CircuitBreaker state transitions, thresholds, and timers.
 */
export interface CircuitBreakerConfig {
  /** Number of consecutive failures in CLOSED state before opening the circuit (default 5) */
  threshold: number;

  /** Milliseconds to stay in OPEN state before attempting HALF_OPEN reset (default 60000) */
  timeout: number;

  /** Total monitoring window duration in ms (default 120000) */
  monitoringPeriod: number;

  /** Rolling window timeout for counting statistics in ms (default 10000) */
  rollingCountTimeout: number;

  /** Number of consecutive successful executions in HALF_OPEN state required to close the circuit (default 2) */
  successThreshold: number;

  /** Maximum time allowed in HALF_OPEN state before forcing back to OPEN if unclosed in ms (default 30000) */
  halfOpenTimeout: number;
}

/**
 * Creates a default CircuitBreakerConfig object with production-ready defaults.
 */
export function createDefaultConfig(overrides?: Partial<CircuitBreakerConfig>): CircuitBreakerConfig {
  return {
    threshold: 5,
    timeout: 60000,
    monitoringPeriod: 120000,
    rollingCountTimeout: 10000,
    successThreshold: 2,
    halfOpenTimeout: 30000,
    ...overrides,
  };
}
