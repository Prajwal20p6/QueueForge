import client from 'prom-client';
import { BaseDaemon } from '../base-daemon';
import { DependencyChecker } from './dependency-checker';
import { HealthAnalyzer } from './health-analyzer';
import { AlertPublisher } from './alert-publisher';

export const healthDatabaseGauge =
  (client.register.getSingleMetric('queueforge_daemon_health_database') as client.Gauge) ||
  new client.Gauge({
    name: 'queueforge_daemon_health_database',
    help: 'Database dependency health status (1=healthy, 0=unhealthy)',
  });

export const healthRedisGauge =
  (client.register.getSingleMetric('queueforge_daemon_health_redis') as client.Gauge) ||
  new client.Gauge({
    name: 'queueforge_daemon_health_redis',
    help: 'Redis dependency health status (1=healthy, 0=unhealthy)',
  });

export const healthQueueGauge =
  (client.register.getSingleMetric('queueforge_daemon_health_queue') as client.Gauge) ||
  new client.Gauge({
    name: 'queueforge_daemon_health_queue',
    help: 'Message Queue dependency health status (1=healthy, 0=unhealthy)',
  });

export const healthScoreGauge =
  (client.register.getSingleMetric('queueforge_daemon_health_score') as client.Gauge) ||
  new client.Gauge({
    name: 'queueforge_daemon_health_score',
    help: 'Overall system health composite score (0-100)',
  });

export interface HealthDaemonDependencies {
  checker?: DependencyChecker;
  analyzer?: HealthAnalyzer;
  alerter?: AlertPublisher;
  logger?: any;
  observability?: any;
}

/**
 * Non-singleton health monitoring daemon running periodic infrastructure checks and updating Prometheus health gauges.
 */
export class HealthDaemon extends BaseDaemon {
  private readonly checker?: DependencyChecker;
  private readonly analyzer?: HealthAnalyzer;
  private readonly alerter?: AlertPublisher;
  private readonly workerMonitor?: any;
  private previousSeverity: string = 'healthy';

  constructor(...args: any[]) {
    let config: any;
    let dependencies: HealthDaemonDependencies = {};
    let logger: any;
    let workerMonitor: any;

    if (args.length >= 2 && (args[0]?.checkAll || args[0]?.checkDatabase)) {
      // Legacy signature: (checker, monitor, logger, metrics)
      const chk = args[0];
      workerMonitor = args[1];
      logger = args[2];
      dependencies = {
        checker: chk,
        logger,
      };
    } else if (args.length >= 2 && (args[0]?.repositories || args[0]?.getRepositories || args[0]?.getQueueManager)) {
      const deps = args[0];
      logger = args[1];
      config = args[3];
      const qm = typeof deps.getQueueManager === 'function' ? deps.getQueueManager() : deps.queueManager;
      const redis = qm?.redis || (typeof deps.getRedis === 'function' ? deps.getRedis() : deps.redis);
      const conn = typeof deps.getRepositories === 'function' ? deps.getRepositories()?.deliveries?.client : null;

      dependencies = {
        checker: new DependencyChecker(conn, redis, qm, logger),
        analyzer: new HealthAnalyzer(logger),
        alerter: new AlertPublisher(undefined, logger),
        logger,
      };
    } else {
      config = args[0];
      dependencies = args[1] || {};
      logger = dependencies.logger || config?.logger;
    }

    const intervalMs = config?.healthCheckIntervalMs || config?.intervalMs || 30000;
    super('HealthDaemon', intervalMs, logger, dependencies.observability);

    this.checker = dependencies.checker;
    this.analyzer = dependencies.analyzer || new HealthAnalyzer(logger);
    this.alerter = dependencies.alerter;
    this.workerMonitor = workerMonitor;
  }

  public async check(): Promise<any> {
    let statusVal = 'HEALTHY';
    if (this.checker && typeof this.checker.checkAll === 'function') {
      const res = await this.checker.checkAll();
      statusVal = res?.overall || statusVal;
    }
    if (this.workerMonitor && typeof this.workerMonitor.checkWorkerHealth === 'function') {
      await this.workerMonitor.checkWorkerHealth();
    }
    await this.execute();
    return { status: statusVal, ...this.getStatus() };
  }

  /**
   * Executes a single health check monitoring cycle.
   */
  public async execute(): Promise<void> {
    this.logger?.info?.('[HealthDaemon] Executing system health check cycle...');

    let checks: any = {
      database: { healthy: true, latencyMs: 5 },
      redis: { healthy: true, latencyMs: 2 },
      queue: { healthy: true, latencyMs: 3 },
      all_healthy: true,
    };

    if (this.checker) {
      try {
        checks = await this.checker.checkAll();
      } catch (err: any) {
        this.logger?.error?.(`[HealthDaemon] Exception executing dependency checker: ${err.message}`);
        checks.all_healthy = false;
        checks.database.healthy = false;
      }
    }

    // Update Prometheus gauges
    const dbHealthy = typeof checks.database === 'object' ? checks.database.healthy : checks.database === 'HEALTHY' || checks.database === 'healthy';
    const redisHealthy = typeof checks.redis === 'object' ? checks.redis.healthy : checks.redis === 'HEALTHY' || checks.redis === 'healthy';
    const queueHealthy = typeof checks.queue === 'object' ? checks.queue.healthy : checks.queue === 'HEALTHY' || checks.queue === 'healthy';

    healthDatabaseGauge.set(dbHealthy ? 1 : 0);
    healthRedisGauge.set(redisHealthy ? 1 : 0);
    healthQueueGauge.set(queueHealthy ? 1 : 0);

    const analysis = this.analyzer?.analyze(checks) || {
      score: checks.all_healthy ? 100 : 0,
      severity: checks.all_healthy ? 'healthy' : 'unhealthy',
      summary: '',
      details: {},
    };

    healthScoreGauge.set(analysis.score);

    // If severity changed, publish alert / recovery event
    if (analysis.severity !== this.previousSeverity) {
      this.logger?.warn?.(`[HealthDaemon] System health severity changed: ${this.previousSeverity} -> ${analysis.severity}`);

      if (this.alerter) {
        if (analysis.severity === 'unhealthy') {
          await this.alerter.publishAlert('critical', 'System health status transitioned to UNHEALTHY', analysis.details);
        } else if (analysis.severity === 'degraded') {
          await this.alerter.publishAlert('warning', 'System health status transitioned to DEGRADED', analysis.details);
        } else if (analysis.severity === 'healthy') {
          await this.alerter.publishRecovery('Infrastructure Dependencies');
        }
      }

      this.previousSeverity = analysis.severity;
    }

    this.logger?.info?.(`[HealthDaemon] Health cycle complete: score=${analysis.score}/100, severity=${analysis.severity}`);
  }
}
