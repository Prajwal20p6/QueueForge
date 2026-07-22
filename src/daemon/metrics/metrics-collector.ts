import client from 'prom-client';
import { BaseDaemon } from '../base-daemon';
import { MetricsAggregator } from './metrics-aggregator';
import { QueueMetricsCollector } from './queue-metrics-collector';
import { DeliveryMetricsCollector } from './delivery-metrics-collector';
import { SystemMetricsCollector } from './system-metrics-collector';

export const metricsCollectionDurationHistogram =
  (client.register.getSingleMetric('queueforge_daemon_metrics_collection_duration_ms') as client.Histogram) ||
  new client.Histogram({
    name: 'queueforge_daemon_metrics_collection_duration_ms',
    help: 'Duration of daemon metrics collection cycle in milliseconds',
    buckets: [1, 5, 10, 50, 100, 500, 1000],
  });

export interface MetricsCollectorDependencies {
  aggregator?: MetricsAggregator;
  logger?: any;
  observability?: any;
}

/**
 * Non-singleton daemon periodically executing metrics aggregation and exporting Prometheus telemetry.
 */
export class MetricsCollector extends BaseDaemon {
  private readonly aggregator?: MetricsAggregator;
  private readonly queueCollector?: any;
  private readonly deliveryCollector?: any;

  constructor(...args: any[]) {
    let config: any;
    let dependencies: MetricsCollectorDependencies = {};
    let logger: any;
    let queueCollector: any;
    let deliveryCollector: any;

    if (args.length >= 2 && (args[0]?.collectMetrics || args[0]?.start)) {
      // Legacy signature: (queueCollector, deliveryCollector, logger)
      queueCollector = args[0];
      deliveryCollector = args[1];
      logger = args[2];
      dependencies = {
        logger,
      };
    } else if (args.length >= 3 && (args[0]?.repositories || args[0]?.getRepositories || args[0]?.getQueueManager)) {
      const deps = args[0];
      logger = args[1];
      config = args[3];
      const qm = typeof deps.getQueueManager === 'function' ? deps.getQueueManager() : deps.queueManager;
      const repos = typeof deps.getRepositories === 'function' ? deps.getRepositories() : (deps.repositories || {});

      queueCollector = new QueueMetricsCollector(qm, undefined, logger);
      deliveryCollector = new DeliveryMetricsCollector(repos.deliveries, undefined, logger);

      const aggregator = new MetricsAggregator(
        [
          queueCollector,
          deliveryCollector,
          new SystemMetricsCollector(logger),
        ],
        undefined,
        logger
      );

      dependencies = {
        aggregator,
        logger,
      };
    } else {
      config = args[0];
      dependencies = args[1] || {};
      logger = dependencies.logger || config?.logger;
    }

    const intervalMs = config?.metricsCollectionIntervalMs || config?.intervalMs || 10000;
    super('MetricsCollector', intervalMs, logger, dependencies.observability);

    this.aggregator = dependencies.aggregator;
    this.queueCollector = queueCollector;
    this.deliveryCollector = deliveryCollector;
  }

  public async getAllMetrics(): Promise<any> {
    let queueData: any = { depth: { main: 0, delayed: 0, dlq: 0 } };
    let deliveryData: any = { successRate: 100 };

    if (this.queueCollector && typeof this.queueCollector.collectMetrics === 'function') {
      queueData = await this.queueCollector.collectMetrics();
    }
    if (this.deliveryCollector && typeof this.deliveryCollector.collectMetrics === 'function') {
      deliveryData = await this.deliveryCollector.collectMetrics();
    }

    if (this.aggregator) {
      const agg = await this.aggregator.aggregate();
      return { queue: queueData, delivery: deliveryData, ...agg };
    }

    return { queue: queueData, delivery: deliveryData };
  }

  /**
   * Executes a single metrics aggregation cycle.
   */
  public async execute(): Promise<void> {
    this.logger?.debug?.('[MetricsCollector] Executing metrics collection cycle...');

    if (this.aggregator) {
      const res = await this.aggregator.aggregate();
      metricsCollectionDurationHistogram.observe(res.duration);
      this.logger?.debug?.(
        `[MetricsCollector] Metrics cycle complete: collected=${res.collected}, failed=${res.failed}, duration=${res.duration}ms`
      );
    }
  }
}
