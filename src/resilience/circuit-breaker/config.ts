import { ResilienceConfig } from '../../config/resilience';
import { ValidationError } from '../../shared/errors/validation-error';

/**
 * Configuration schema for individual circuit breakers.
 */
export interface CircuitBreakerConfig {
  /** Percentage of failures before opening circuit (e.g., 50) */
  threshold: number;
  /** Timeout in milliseconds in OPEN state before trying to recover (e.g., 60000) */
  timeoutMs: number;
  /** Minimum number of requests before failure rate is evaluated */
  volumeThreshold: number;
}

/**
 * Resolves standard and per-destination custom overrides for circuit breakers.
 */
export function getCircuitBreakerConfig(
  config: ResilienceConfig
): Map<string, CircuitBreakerConfig> {
  const registry = new Map<string, CircuitBreakerConfig>();

  const threshold = config.circuitBreakerThreshold;
  const timeoutMs = config.circuitBreakerTimeout * 1000; // convert seconds to ms
  const volumeThreshold = config.circuitBreakerVolumeThreshold;

  if (threshold <= 0 || threshold > 100) {
    throw new ValidationError('circuitBreakerThreshold', {
      message: 'Circuit breaker failure threshold percentage must be between 1 and 100',
    });
  }

  if (timeoutMs <= 0) {
    throw new ValidationError('circuitBreakerTimeout', {
      message: 'Circuit breaker open state timeout must be a positive number',
    });
  }

  if (volumeThreshold <= 0) {
    throw new ValidationError('circuitBreakerVolumeThreshold', {
      message: 'Circuit breaker request volume threshold must be a positive number',
    });
  }

  // Populate default base configuration
  registry.set('default', {
    threshold,
    timeoutMs,
    volumeThreshold,
  });

  return registry;
}
