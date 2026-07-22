import { DependencyContainer } from './types';
import { DependencyChecker } from '../daemon/health/dependency-checker';

/**
 * Polls the system health status repeatedly on startup to confirm all services are online and ready.
 *
 * @param container - The DependencyContainer context.
 * @param timeoutMs - Maximum duration (in milliseconds) to wait before throwing.
 * @param pollIntervalMs - Polling sleep duration (in milliseconds) between checks.
 */
export async function waitForHealthy(
  container: DependencyContainer,
  timeoutMs = 30000,
  pollIntervalMs = 1000
): Promise<void> {
  const logger = container.getLogger();
  logger.info('[HealthCheckStartup] Verifying dependency readiness probes before starting traffic...');

  const startTime = Date.now();
  const prisma = container.getPrisma();
  const redis = container.getRedis();
  const queueManager = container.getQueueManager();
  const queue = queueManager.getMainQueue();
  const metrics = container.getObservability().metrics;

  const checker = new DependencyChecker(prisma, redis, queue, logger as any, metrics);

  while (Date.now() - startTime < timeoutMs) {
    try {
      const status = await checker.checkAll();
      if (status.overall === 'HEALTHY') {
        logger.info('[HealthCheckStartup] All critical dependencies are verified healthy and online.');
        return;
      }
      logger.warn(`[HealthCheckStartup] System is currently in status: ${status.overall}. Retrying in ${pollIntervalMs}ms...`);
    } catch (err: any) {
      logger.warn(`[HealthCheckStartup] Diagnostics connection poll threw an exception: ${err.message}. Retrying...`);
    }
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  logger.error('[HealthCheckStartup] Dependency check timed out before system reached a healthy state.');
  throw new Error(`Readiness check timed out after ${timeoutMs}ms without attaining HEALTHY status.`);
}
