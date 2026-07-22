import { Config } from '../config';
import { Logger } from '../observability/logging/logger';
import { DaemonCoordinator } from '../daemon';
import { DependencyContainer } from './types';

import { WorkerMonitor } from '../daemon/health/worker-monitor';
import { DependencyChecker } from '../daemon/health/dependency-checker';
import { HealthCheckDaemonCoordinator } from '../daemon/health';

import { QueueMetricsCollector } from '../daemon/metrics/queue-metrics';
import { DeliveryMetricsCollector } from '../daemon/metrics/delivery-metrics';
import { MetricsCollectorCoordinator } from '../daemon/metrics';

import { DelayedQueueProcessor } from '../daemon/recovery/delayed-queue-processor';
import { StateSyncDaemon } from '../daemon/recovery/state-sync';
import { DLQMonitor } from '../daemon/recovery/dlq-monitor';
import { RecoveryDaemonCoordinator } from '../daemon/recovery';

/**
 * Conditionally instantiates and boots up all health checking and status aggregation background daemons.
 *
 * @param config - The application unified configuration object.
 * @param dependencies - The instantiated DependencyContainer.
 * @param logger - The application logger.
 * @returns Configured DaemonCoordinator instance or null if disabled.
 */
export async function setupDaemon(
  config: Config,
  dependencies: DependencyContainer,
  logger: Logger
): Promise<DaemonCoordinator | null> {
  const shouldStart = process.env.START_DAEMON !== 'false' && config.app?.nodeEnv !== 'test';

  if (!shouldStart) {
    logger.info('[DaemonSetup] Background daemon coordinator initialization skipped (disabled by environment).');
    return null;
  }

  logger.info('[DaemonSetup] Initializing background daemons coordinator...');

  try {
    const prisma = dependencies.getPrisma();
    const redis = dependencies.getRedis();
    const queueManager = dependencies.getQueueManager();
    const queue = queueManager.getMainQueue();
    const metrics = dependencies.getObservability().metrics;
    const repositories = (dependencies as any).getRepositories();

    // 1. Configure Health Check Subsystem
    const dependencyChecker = new DependencyChecker(
      prisma,
      redis,
      queue,
      logger as any,
      metrics
    );
    const workerMonitor = new WorkerMonitor(redis, logger as any, metrics);
    const healthCoordinator = new HealthCheckDaemonCoordinator(
      dependencyChecker,
      workerMonitor,
      logger as any,
      metrics
    );

    // 2. Configure Metrics Collector Subsystem
    const queueCollector = new QueueMetricsCollector(queue, metrics, logger as any);
    const deliveryCollector = new DeliveryMetricsCollector(
      repositories.deliveries,
      metrics,
      logger as any
    );
    const metricsCoordinator = new MetricsCollectorCoordinator(
      queueCollector,
      deliveryCollector,
      logger as any
    );

    // 3. Configure Recovery Subsystem
    const delayedQueueProcessor = new DelayedQueueProcessor(
      queue,
      repositories.deliveries,
      logger as any,
      metrics,
      dependencies.getObservability().tracer as any
    );
    const stateSync = new StateSyncDaemon(
      repositories.deliveries,
      queue,
      redis,
      logger as any,
      metrics
    );
    const dlqMonitor = new DLQMonitor(
      queueManager.getDLQ(),
      repositories.deliveries,
      logger as any,
      metrics
    );
    const recoveryCoordinator = new RecoveryDaemonCoordinator(
      delayedQueueProcessor,
      stateSync,
      dlqMonitor,
      logger as any
    );

    // 4. Instantiate Root DaemonCoordinator
    const daemonCoordinator = new DaemonCoordinator(
      recoveryCoordinator,
      healthCoordinator,
      metricsCoordinator,
      logger as any,
      metrics
    );

    await daemonCoordinator.start();
    logger.info('[DaemonSetup] Background daemons subsystem started successfully.');
    return daemonCoordinator;
  } catch (err: any) {
    logger.error('[DaemonSetup] Failed to initialize daemons engine', err);
    throw err;
  }
}
export { DaemonCoordinator };
