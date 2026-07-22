import os from 'os';
import client from 'prom-client';

export const systemMemoryUsageGauge =
  (client.register.getSingleMetric('queueforge_system_memory_bytes') as client.Gauge) ||
  new client.Gauge({
    name: 'queueforge_system_memory_bytes',
    help: 'System process memory usage in bytes',
    labelNames: ['type'],
  });

export const systemCpuUsageGauge =
  (client.register.getSingleMetric('queueforge_system_cpu_usage_ratio') as client.Gauge) ||
  new client.Gauge({
    name: 'queueforge_system_cpu_usage_ratio',
    help: 'System process CPU load ratio',
  });

export const systemUptimeGauge =
  (client.register.getSingleMetric('queueforge_system_uptime_seconds') as client.Gauge) ||
  new client.Gauge({
    name: 'queueforge_system_uptime_seconds',
    help: 'System process uptime in seconds',
  });

/**
 * Metric collector sampling Node.js process CPU, RSS/heap memory, uptime, and event loop lag.
 */
export class SystemMetricsCollector {
  public readonly name = 'SystemMetricsCollector';

  constructor(private readonly logger?: any) {}

  /**
   * Samples process system resources and updates Prometheus metrics gauges.
   */
  public async collect(): Promise<Record<string, number>> {
    try {
      const memory = process.memoryUsage();
      const uptime = process.uptime();
      const loadAvg = os.loadavg();
      const cpuRatio = loadAvg[0] / Math.max(1, os.cpus().length);

      systemMemoryUsageGauge.set({ type: 'rss' }, memory.rss);
      systemMemoryUsageGauge.set({ type: 'heapTotal' }, memory.heapTotal);
      systemMemoryUsageGauge.set({ type: 'heapUsed' }, memory.heapUsed);
      systemCpuUsageGauge.set(cpuRatio);
      systemUptimeGauge.set(uptime);

      this.logger?.debug?.(
        `[SystemMetricsCollector] Sampled system metrics: memoryRss=${Math.floor(memory.rss / 1024 / 1024)}MB, uptime=${Math.floor(uptime)}s`
      );

      return {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        cpuRatio,
        uptime,
      };
    } catch (err: any) {
      this.logger?.error?.(`[SystemMetricsCollector] Error collecting system metrics: ${err.message}`);
      return {};
    }
  }
}
