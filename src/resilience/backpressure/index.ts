import { EventEmitter } from 'events';
import Redis from 'ioredis';
import client from 'prom-client';
import { ResilienceConfig } from '../../config/resilience';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';
import { BackpressureStatus } from '../types';
import { QueueMonitor } from './queue-monitor';
import { AlarmSystem } from './alarm-system';
import { getSheddingPolicy } from './shedding-strategy';

export * from './queue-monitor';
export * from './shedding-strategy';
export * from './backpressure-monitor';
export * from './adaptive-limiter';
export * from './alarm-system';

// Register prometheus metrics counters and gauges
export const qDepthGauge =
  (client.register.getSingleMetric('queue_depth') as client.Gauge) ||
  new client.Gauge({
    name: 'queue_depth',
    help: 'Main queue active jobs depth',
  });

export const qUtilizationGauge =
  (client.register.getSingleMetric('queue_utilization_percent') as client.Gauge) ||
  new client.Gauge({
    name: 'queue_utilization_percent',
    help: 'Queue threshold utilization percentage',
  });

/**
 * Main BackpressureHandler orchestration class managing monitoring loop and alerting.
 */
export class BackpressureHandler extends EventEmitter {
  private readonly monitor: QueueMonitor;
  private readonly alarms: AlarmSystem;
  private monitorInterval: NodeJS.Timeout | null = null;

  constructor(
    queue: any,
    _redis: Redis,
    private readonly config: ResilienceConfig,
    private readonly logger: Logger,
    metrics: any
  ) {
    super();
    this.monitor = new QueueMonitor(queue, config, logger);
    this.alarms = new AlarmSystem(config, logger, metrics);
  }

  public async getStatus(): Promise<BackpressureStatus> {
    const depth = await this.monitor.getDepth();
    const threshold = this.config.backpressureQueueDepthThreshold;
    const isUnderPressure = await this.monitor.isUnderBackpressure();
    const policy = getSheddingPolicy(this.config);

    return {
      isUnderPressure,
      depth,
      threshold,
      strategy: policy.strategy,
    };
  }

  public async checkBackpressure(): Promise<boolean> {
    const pct = await this.monitor.getPercentageOfMax();
    const depth = await this.monitor.getDepth();

    qDepthGauge.set(depth);
    qUtilizationGauge.set(pct);

    const level = this.alarms.checkThreshold(depth, this.config.backpressureQueueDepthThreshold);
    this.alarms.recordAlarm(level, depth);

    const isUnderPressure = await this.monitor.isUnderBackpressure();
    if (isUnderPressure) {
      this.emit('backpressure:tripped', { pct, depth });
      this.logger.warn(
        `[Backpressure System] Queue depth capacity limit threshold reached (${pct.toFixed(1)}%). Shedding policy activated.`
      );
    }

    return isUnderPressure;
  }

  public startMonitoring(): void {
    if (this.monitorInterval) return;
    this.logger.info('[Backpressure Monitor] Starting queue depth background daemon loop...');
    this.monitorInterval = setInterval(async () => {
      try {
        await this.checkBackpressure();
      } catch (err: any) {
        this.logger.error(`Error executing backpressure poll check: ${err.message}`);
      }
    }, 10000);
  }

  public stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      this.logger.info('[Backpressure Monitor] Stopped queue depth background daemon.');
    }
  }
}
