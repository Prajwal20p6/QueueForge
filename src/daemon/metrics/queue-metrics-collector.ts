import client from 'prom-client';

export const queueDepthMainGauge =
  (client.register.getSingleMetric('queueforge_queue_depth_main') as client.Gauge) ||
  new client.Gauge({
    name: 'queueforge_queue_depth_main',
    help: 'Current depth count of main job queue',
  });

export const queueDepthDelayedGauge =
  (client.register.getSingleMetric('queueforge_queue_depth_delayed') as client.Gauge) ||
  new client.Gauge({
    name: 'queueforge_queue_depth_delayed',
    help: 'Current depth count of delayed retry queue',
  });

export const queueDepthDLQGauge =
  (client.register.getSingleMetric('queueforge_queue_depth_dlq') as client.Gauge) ||
  new client.Gauge({
    name: 'queueforge_queue_depth_dlq',
    help: 'Current depth count of Dead Letter Queue',
  });

/**
 * Metric collector sampling queue depths (main, delayed, DLQ) and state breakdowns using BullMQ APIs.
 */
export class QueueMetricsCollector {
  public readonly name = 'QueueMetricsCollector';

  constructor(
    private readonly queueManager: any,
    _metricsRegistry?: any,
    private readonly logger?: any
  ) {}

  public async collectMetrics(): Promise<any> {
    return this.collect();
  }

  /**
   * Collects current queue stats and updates Prometheus metrics gauges.
   */
  public async collect(): Promise<any> {
    try {
      let mainDepth = 0;
      let delayedDepth = 0;
      let dlqDepth = 0;
      let successRate = 100;

      if (this.queueManager && typeof this.queueManager.getWaitingCount === 'function') {
        const waiting = await this.queueManager.getWaitingCount();
        const active = await this.queueManager.getActiveCount();
        const delayed = await this.queueManager.getDelayedCount();
        const completed = await this.queueManager.getCompletedCount();
        const failed = await this.queueManager.getFailedCount();

        mainDepth = waiting + active;
        delayedDepth = delayed;
        dlqDepth = failed;

        const total = completed + failed;
        successRate = total > 0 ? (completed / total) * 100 : 100;
      } else if (this.queueManager && typeof this.queueManager.getStats === 'function') {
        const stats = await this.queueManager.getStats();
        mainDepth = stats.mainDepth || stats.waiting || 0;
        delayedDepth = stats.delayedDepth || stats.delayed || 0;
        dlqDepth = stats.dlqDepth || stats.failed || 0;
      } else if (this.queueManager && typeof this.queueManager.getMainQueue === 'function') {
        const mainQ = this.queueManager.getMainQueue();
        const delayedQ = this.queueManager.getDelayedQueue ? this.queueManager.getDelayedQueue() : null;
        const dlqQ = this.queueManager.getDlqQueue ? this.queueManager.getDlqQueue() : null;

        const mainCounts = mainQ && typeof mainQ.getJobCounts === 'function' ? await mainQ.getJobCounts() : {};
        const delayedCounts = delayedQ && typeof delayedQ.getJobCounts === 'function' ? await delayedQ.getJobCounts() : {};
        const dlqCounts = dlqQ && typeof dlqQ.getJobCounts === 'function' ? await dlqQ.getJobCounts() : {};

        mainDepth = (mainCounts.waiting || 0) + (mainCounts.active || 0);
        delayedDepth = (delayedCounts.delayed || 0) + (mainCounts.delayed || 0);
        dlqDepth = (dlqCounts.failed || 0) + (mainCounts.failed || 0);
      } else if (this.queueManager && typeof this.queueManager.getJobCounts === 'function') {
        const counts = await this.queueManager.getJobCounts();
        mainDepth = (counts.waiting || 0) + (counts.active || 0);
        delayedDepth = counts.delayed || 0;
        dlqDepth = counts.failed || 0;
      }

      queueDepthMainGauge.set(mainDepth);
      queueDepthDelayedGauge.set(delayedDepth);
      queueDepthDLQGauge.set(dlqDepth);

      this.logger?.debug?.(`[QueueMetricsCollector] Sampled queue metrics: main=${mainDepth}, delayed=${delayedDepth}, dlq=${dlqDepth}`);

      return {
        depth: {
          main: mainDepth,
          delayed: delayedDepth,
          dlq: dlqDepth,
        },
        mainDepth,
        delayedDepth,
        dlqDepth,
        throughput: 0,
        successRate,
        avgLatency: 0,
      };
    } catch (err: any) {
      this.logger?.error?.(`[QueueMetricsCollector] Error collecting queue metrics: ${err.message}`);
      return {
        depth: { main: 0, delayed: 0, dlq: 0 },
        mainDepth: 0,
        delayedDepth: 0,
        dlqDepth: 0,
        successRate: 100,
      };
    }
  }
}
