import { ResilienceConfig } from '../../config/resilience';
import { ValidationError } from '../../shared/errors/validation-error';

/**
 * Returns slots isolation configuration properties per destination type channel.
 */
export function configureQueueIsolation(
  config: ResilienceConfig
): Map<string, { poolSize: number; concurrency: number }> {
  const mapping = new Map<string, { poolSize: number; concurrency: number }>();

  const webhookSize = config.bulkheadPoolSizeWebhook;
  const dbSize = config.bulkheadPoolSizeDatabase;
  const queueSize = config.bulkheadPoolSizeQueue;
  const auditSize = 3; // Standard audit pool default

  if (webhookSize <= 0 || dbSize <= 0 || queueSize <= 0) {
    throw new ValidationError('bulkheadPoolSize', {
      message: 'Bulkhead pool sizes must be positive integers',
    });
  }

  mapping.set('WEBHOOK', { poolSize: webhookSize, concurrency: webhookSize });
  mapping.set('DATABASE', { poolSize: dbSize, concurrency: dbSize });
  mapping.set('QUEUE', { poolSize: queueSize, concurrency: queueSize });
  mapping.set('AUDIT', { poolSize: auditSize, concurrency: auditSize });

  return mapping;
}
export { ResilienceConfig };
