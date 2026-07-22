import CircuitBreaker from 'opossum';
import { ResilienceConfig } from '../../config/resilience';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

/**
 * Creates and configures a new Opossum circuit breaker instance wrapping a dummy or functional action.
 */
export function createBreaker(
  destinationId: string,
  config: ResilienceConfig,
  logger: Logger,
  action: (...args: any[]) => Promise<any> = async () => {}
): CircuitBreaker<any, any> {
  logger.info(`Creating Opossum breaker instance for destination: ${destinationId}`);

  const options: CircuitBreaker.Options = {
    timeout: 30000, // Action timeout in ms (default to 30s)
    errorThresholdPercentage: config.circuitBreakerThreshold,
    resetTimeout: config.circuitBreakerTimeout * 1000, // convert seconds to ms
    volumeThreshold: config.circuitBreakerVolumeThreshold,
    name: `breaker:${destinationId}`,
    rollingCountBuckets: 10,
    rollingCountTimeout: 10000,
  };

  const breaker = new CircuitBreaker(action, options);

  // Hook up event handlers to capture logs and state change notifications
  breaker.on('open', () => {
    logger.warn(`[CircuitBreaker] Breaker opened for destination "${destinationId}"`);
  });

  breaker.on('close', () => {
    logger.info(`[CircuitBreaker] Breaker closed for destination "${destinationId}"`);
  });

  breaker.on('halfOpen', () => {
    logger.warn(`[CircuitBreaker] Breaker entered halfOpen state for destination "${destinationId}"`);
  });

  breaker.on('fire', () => {
    logger.debug(`[CircuitBreaker] Action executed through breaker "${destinationId}"`);
  });

  breaker.on('fallback', (err: any) => {
    logger.warn(`[CircuitBreaker] Fallback triggered on breaker "${destinationId}" due to error: ${err.message}`);
  });

  return breaker;
}
