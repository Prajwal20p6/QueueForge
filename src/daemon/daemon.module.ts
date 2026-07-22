import { DaemonCoordinator } from './coordinator/daemon-coordinator';
import { DaemonType } from './coordinator/coordination';
import { StaleJobDetector } from './recovery/stale-job-detector';
import { QueueReconstructor } from './recovery/queue-reconstructor';
import { DLQMonitor } from './recovery/dlq-monitor';
import { RecoveryDaemon } from './recovery/recovery-daemon';
import { DependencyChecker } from './health/dependency-checker';
import { HealthAnalyzer } from './health/health-analyzer';
import { AlertPublisher } from './health/alert-publisher';
import { HealthDaemon } from './health/health-daemon';
import { QueueMetricsCollector } from './metrics/queue-metrics-collector';
import { DeliveryMetricsCollector } from './metrics/delivery-metrics-collector';
import { SystemMetricsCollector } from './metrics/system-metrics-collector';
import { MetricsAggregator } from './metrics/metrics-aggregator';
import { MetricsCollector } from './metrics/metrics-collector';

export interface DaemonModuleDependencies {
  repositories?: any;
  queueManager?: any;
  redisModule?: any;
  services?: any;
  resilience?: any;
  observability?: any;
  logger?: any;
  eventPublisher?: any;
}

export interface DaemonModule {
  coordinator: DaemonCoordinator;
  daemons: {
    recovery: RecoveryDaemon;
    health: HealthDaemon;
    metrics: MetricsCollector;
  };
}

/**
 * Initializes and bootstraps all QueueForge background daemon services, distributed coordinator, recovery engines, and health/metrics daemons.
 */
export async function initializeDaemonModule(
  config?: any,
  dependencies: DaemonModuleDependencies = {}
): Promise<DaemonModule> {
  const logger = dependencies.logger;
  const observability = dependencies.observability;
  const repositories = dependencies.repositories || {};
  const queueManager = dependencies.queueManager;
  const redisOps = dependencies.redisModule?.redis || queueManager?.redis;
  const eventPublisher = dependencies.eventPublisher || dependencies.services?.eventPublisher;

  // 1. Coordinator
  const coordinator = new DaemonCoordinator(redisOps, undefined, undefined, logger);

  // 2. Recovery Subsystem
  const detector = new StaleJobDetector(repositories.deliveries, undefined, config?.daemon, logger);
  const reconstructor = new QueueReconstructor(repositories.deliveries, queueManager, logger);
  const dlqMonitor = new DLQMonitor(repositories.deliveries, eventPublisher, config?.daemon, logger);
  const recovery = new RecoveryDaemon(config?.daemon, {
    detector,
    reconstructor,
    dlqMonitor,
    logger,
    observability,
  });

  // 3. Health Subsystem
  const connectionPool = repositories.deliveries?.client || repositories.client;
  const checker = new DependencyChecker(connectionPool, redisOps, queueManager, logger);
  const analyzer = new HealthAnalyzer(logger);
  const alerter = new AlertPublisher(eventPublisher, logger);
  const health = new HealthDaemon(config?.daemon, {
    checker,
    analyzer,
    alerter,
    logger,
    observability,
  });

  // 4. Metrics Subsystem
  const queueMetricsCollector = new QueueMetricsCollector(queueManager, undefined, logger);
  const deliveryMetricsCollector = new DeliveryMetricsCollector(repositories.deliveries, undefined, logger);
  const systemMetricsCollector = new SystemMetricsCollector(logger);

  const aggregator = new MetricsAggregator(
    [queueMetricsCollector, deliveryMetricsCollector, systemMetricsCollector],
    undefined,
    logger
  );

  const metrics = new MetricsCollector(config?.daemon, {
    aggregator,
    logger,
    observability,
  });

  // Register daemons with coordinator
  await coordinator.registerDaemon(DaemonType.HEALTH, health);
  await coordinator.registerDaemon(DaemonType.METRICS, metrics);
  await coordinator.registerDaemon(DaemonType.RECOVERY, recovery);

  // Start daemons
  await health.start();
  await metrics.start();

  // Recovery runs if node is PRIMARY
  if (coordinator.getRole(DaemonType.RECOVERY) === 'PRIMARY' as any) {
    await recovery.start();
  }

  logger?.info?.('Daemon module initialized successfully with recovery, health monitoring, metrics collectors, and leader coordinator.');

  return {
    coordinator,
    daemons: {
      recovery,
      health,
      metrics,
    },
  };
}

/**
 * Backward compatibility alias for daemon module initialization.
 */
export async function initializeDaemons(
  config?: any,
  dependencies: DaemonModuleDependencies = {}
): Promise<DaemonModule> {
  return initializeDaemonModule(config, dependencies);
}
