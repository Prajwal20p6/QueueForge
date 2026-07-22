import Redis from 'ioredis';
import { WorkerStats } from '../types';
import { Logger } from '../../observability/logging/logger';
import { MetricsRegistry } from '../../observability/metrics/metrics-registry';

/**
 * Health monitor class auditing worker heartbeat records in Redis.
 */
export class WorkerMonitor {
  private readonly redis: Redis;
  private readonly logger: Logger;
  private readonly metrics: MetricsRegistry;

  constructor(redis: Redis, logger: Logger, metrics: MetricsRegistry) {
    this.redis = redis;
    this.logger = logger;
    this.metrics = metrics;
  }

  /**
   * Evaluates active, stale, and total registered workers.
   */
  public async checkWorkerHealth(): Promise<{
    activeWorkers: number;
    staleWorkers: number;
    totalWorkers: number;
  }> {
    try {
      const registered = await this.redis.smembers('workers:all');
      let activeWorkers = 0;
      let staleWorkers = 0;

      if (registered.length > 0) {
        const pipeline = this.redis.pipeline();
        registered.forEach((id) => {
          pipeline.exists(`heartbeat:${id}`);
        });

        const results = await pipeline.exec();
        if (results) {
          results.forEach((res) => {
            const [_err, exists] = res;
            if (exists === 1) {
              activeWorkers++;
            } else {
              staleWorkers++;
            }
          });
        }
      }

      const totalWorkers = registered.length;

      // Telemetry update
      const meter = this.metrics.getMeter();
      if (meter) {
        const activeGauge = meter.createUpDownCounter('active_workers');
        activeGauge.add(activeWorkers - (activeGauge as any).value || activeWorkers);

        const staleGauge = meter.createUpDownCounter('stale_workers');
        staleGauge.add(staleWorkers - (staleGauge as any).value || staleWorkers);

        const countGauge = meter.createUpDownCounter('worker_count');
        countGauge.add(totalWorkers - (countGauge as any).value || totalWorkers);
      }

      return {
        activeWorkers,
        staleWorkers,
        totalWorkers,
      };
    } catch (err: any) {
      this.logger.error(`[WorkerMonitor] Failed to compute worker heartbeat health: ${err.message}`);
      return { activeWorkers: 0, staleWorkers: 0, totalWorkers: 0 };
    }
  }

  /**
   * Compiles diagnostic performance stats for all registered workers.
   */
  public async getWorkerStats(): Promise<{ [workerId: string]: WorkerStats }> {
    const stats: { [workerId: string]: WorkerStats } = {};
    try {
      const registered = await this.redis.smembers('workers:all');

      for (const id of registered) {
        const ttl = await this.redis.ttl(`heartbeat:${id}`);
        const lastHeartbeat = ttl > 0 ? new Date(Date.now() - (30 - ttl) * 1000) : null;

        // Fetch custom worker metric hash if stored
        const rawStats = await this.redis.hgetall(`worker:stats:${id}`);

        stats[id] = {
          workerId: id,
          activeJobs: parseInt(rawStats?.active || '0', 10),
          processedJobs: parseInt(rawStats?.processed || '0', 10),
          failedJobs: parseInt(rawStats?.failed || '0', 10),
          lastHeartbeat,
          uptime: parseInt(rawStats?.uptime || '0', 10),
        };
      }
    } catch (err: any) {
      this.logger.error(`[WorkerMonitor] Failed to fetch worker stats map: ${err.message}`);
    }

    return stats;
  }

  /**
   * Returns true if active workers count satisfies minimum requirements.
   */
  public async isHealthy(minActiveWorkers?: number): Promise<boolean> {
    const { activeWorkers } = await this.checkWorkerHealth();
    const minLimit = minActiveWorkers !== undefined ? minActiveWorkers : 1;
    const ok = activeWorkers >= minLimit;
    if (!ok) {
      this.logger.warn(
        `[WorkerMonitor] Starvation alert: active workers count (${activeWorkers}) is less than min threshold (${minLimit})`
      );
    }
    return ok;
  }
}
export { Redis };
