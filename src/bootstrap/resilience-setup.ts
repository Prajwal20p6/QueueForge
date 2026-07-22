import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { Config } from '../config';
import { Logger } from '../observability/logging/logger';
import { MetricsRegistry } from '../observability/metrics/metrics-registry';
import { ResilienceContext, createResilienceContext } from '../resilience';

/**
 * Initializes circuit breakers, bulkheads, retry engines, and backpressure monitors.
 *
 * @param redis - Connected Redis client instance.
 * @param queue - The main BullMQ Queue instance.
 * @param config - The application unified configuration object.
 * @param logger - The application logger.
 * @param metrics - Observability metrics registry instance.
 * @returns Configured ResilienceContext object.
 */
export async function setupResilience(
  redis: Redis,
  queue: Queue,
  config: Config,
  logger: Logger,
  metrics: MetricsRegistry
): Promise<ResilienceContext> {
  logger.info('[ResilienceSetup] Mounting opossum circuit breakers and queue bulkheads...');

  try {
    const context = createResilienceContext(
      redis,
      queue,
      config.resilience,
      logger as any,
      metrics
    );
    logger.info('[ResilienceSetup] Resilience context generated successfully.');
    return context;
  } catch (err: any) {
    logger.error('[ResilienceSetup] Failed to configure resilience handlers', err);
    throw err;
  }
}
export { ResilienceContext };
