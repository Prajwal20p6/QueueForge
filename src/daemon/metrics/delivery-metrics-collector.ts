import client from 'prom-client';

export const deliveryCountByStatusGauge =
  (client.register.getSingleMetric('queueforge_delivery_count_by_status') as client.Gauge) ||
  new client.Gauge({
    name: 'queueforge_delivery_count_by_status',
    help: 'Total deliveries grouped by status',
    labelNames: ['status'],
  });

/**
 * Metric collector querying database for delivery status distributions and success rates.
 */
export class DeliveryMetricsCollector {
  public readonly name = 'DeliveryMetricsCollector';

  constructor(
    private readonly deliveryRepository: any,
    _metricsRegistry?: any,
    private readonly logger?: any
  ) {}

  public async collectMetrics(): Promise<any> {
    return this.collect();
  }

  /**
   * Queries delivery status totals and publishes Prometheus metrics.
   */
  public async collect(): Promise<any> {
    try {
      const statuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'SCHEDULED_RETRY', 'FAILED_DLQ'];
      const counts: Record<string, number> = {};

      for (const st of statuses) {
        let cnt = 0;
        if (this.deliveryRepository && typeof this.deliveryRepository.countByStatus === 'function') {
          cnt = await this.deliveryRepository.countByStatus(st);
        } else if (this.deliveryRepository && typeof this.deliveryRepository.count === 'function') {
          cnt = await this.deliveryRepository.count({ status: st });
        } else if (this.deliveryRepository && typeof this.deliveryRepository.findByStatus === 'function') {
          const list = await this.deliveryRepository.findByStatus(st);
          cnt = list?.length || 0;
        }

        counts[st] = cnt;
        deliveryCountByStatusGauge.set({ status: st.toLowerCase() }, cnt);
      }

      let completedCount = counts.COMPLETED || 0;
      let failedDlqCount = counts.FAILED_DLQ || 0;
      let totalCount = completedCount + failedDlqCount;
      let avgRetriesVal = 0;
      let avgLatencyVal = 0;

      const byDestinationType: Record<string, any> = {
        WEBHOOK: { count: 0, successRate: 0, failureRate: 0, dlqRate: 0, avgRetries: 0, avgLatency: 0 },
      };

      try {
        const { getPrismaClient } = require('../../infrastructure/database/client');
        const prisma = getPrismaClient();

        if (prisma && prisma.taskResultDelivery) {
          const cComp = await prisma.taskResultDelivery.count({ where: { status: 'COMPLETED' } });
          const cFail = await prisma.taskResultDelivery.count({ where: { status: 'FAILED_DLQ' } });

          if (cComp || cFail) {
            completedCount = cComp;
            failedDlqCount = cFail;
            totalCount = completedCount + failedDlqCount;
          }

          const agg = await prisma.taskResultDelivery.aggregate({ _avg: { retryCount: true } });
          if (agg?._avg?.retryCount != null) {
            avgRetriesVal = agg._avg.retryCount;
          }

          const delList = await prisma.taskResultDelivery.findMany();
          if (Array.isArray(delList)) {
            for (const d of delList) {
              const dt = d.destination?.destinationType || 'WEBHOOK';
              if (!byDestinationType[dt]) {
                byDestinationType[dt] = { count: 0, successRate: 100, failureRate: 0, dlqRate: 0, avgRetries: 0, avgLatency: 0 };
              }
              byDestinationType[dt].count++;
            }
          }
        }

        if (prisma && prisma.taskResultDeliveryAttempt) {
          const attAgg = await prisma.taskResultDeliveryAttempt.aggregate({ _avg: { responseTimeMs: true } });
          if (attAgg?._avg?.responseTimeMs != null) {
            avgLatencyVal = attAgg._avg.responseTimeMs;
          }
        }
      } catch {
        // ignore
      }

      const successRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 100;
      const failureRate = totalCount > 0 ? (failedDlqCount / totalCount) * 100 : 0;

      this.logger?.debug?.('[DeliveryMetricsCollector] Sampled delivery counts:', counts);

      return {
        ...counts,
        successRate,
        failureRate,
        dlqRate: failureRate,
        avgRetries: avgRetriesVal,
        avgLatency: avgLatencyVal,
        byDestinationType,
      };
    } catch (err: any) {
      this.logger?.error?.(`[DeliveryMetricsCollector] Error collecting delivery metrics: ${err.message}`);
      return {
        successRate: 100,
        failureRate: 0,
        dlqRate: 0,
        avgRetries: 0,
        avgLatency: 0,
        byDestinationType: {},
      };
    }
  }
}
