import Redis from 'ioredis';
import { ResilienceConfig } from '../config/resilience';
import { AuditLogger as Logger } from '../infrastructure/repositories/base.repository';
import { CircuitBreakerManager } from './circuit-breaker';
import { BulkheadManager } from './bulkhead';
import { BackpressureHandler } from './backpressure';
import { RetryEngine } from './retry';
import { ResilienceContext } from './types';

export * from './types';
export * from './circuit-breaker';
export * from './bulkhead';
export * from './backpressure';
export * from './retry';
export * from './timeout';
export * from './errors';
export * from './resilience.module';

/**
 * Resilience context factory compiling all manager configurations.
 */
export function createResilienceContext(
  redis: Redis,
  queue: any,
  config: ResilienceConfig,
  logger: Logger,
  metrics: any
): ResilienceContext {
  const circuitBreaker = new CircuitBreakerManager(config, logger, metrics);
  const bulkhead = new BulkheadManager(config, logger, metrics);
  const backpressure = new BackpressureHandler(queue, redis, config, logger, metrics);
  const retry = new RetryEngine(config, logger, metrics);

  return {
    circuitBreaker,
    bulkhead,
    backpressure,
    retry,
  };
}
export { ResilienceConfig };
export { ResilienceContext };
