import client from 'prom-client';

export const workerJobsTotalCounter =
  (client.register.getSingleMetric('queueforge_worker_jobs_total') as client.Counter) ||
  new client.Counter({
    name: 'queueforge_worker_jobs_total',
    help: 'Total jobs processed by worker layer',
    labelNames: ['status'],
  });

export const workerJobDurationHistogram =
  (client.register.getSingleMetric('queueforge_worker_job_duration_ms') as client.Histogram) ||
  new client.Histogram({
    name: 'queueforge_worker_job_duration_ms',
    help: 'Job execution duration in milliseconds',
    buckets: [10, 50, 100, 500, 1000, 5000, 10000, 30000],
  });

export const workerJobErrorsCounter =
  (client.register.getSingleMetric('queueforge_worker_job_errors_total') as client.Counter) ||
  new client.Counter({
    name: 'queueforge_worker_job_errors_total',
    help: 'Total failed jobs handled by worker layer',
  });

export const workerActiveJobsGauge =
  (client.register.getSingleMetric('queueforge_worker_active_jobs') as client.Gauge) ||
  new client.Gauge({
    name: 'queueforge_worker_active_jobs',
    help: 'Currently active jobs processing count',
  });

export const workerRetryCounter =
  (client.register.getSingleMetric('queueforge_worker_retry_count') as client.Counter) ||
  new client.Counter({
    name: 'queueforge_worker_retry_count',
    help: 'Total scheduled retry executions count',
  });

export const workerDLQCounter =
  (client.register.getSingleMetric('queueforge_worker_dlq_count') as client.Counter) ||
  new client.Counter({
    name: 'queueforge_worker_dlq_count',
    help: 'Total jobs moved to Dead Letter Queue count',
  });

export const connectorLatencyHistogram =
  (client.register.getSingleMetric('queueforge_worker_connector_latency_ms') as client.Histogram) ||
  new client.Histogram({
    name: 'queueforge_worker_connector_latency_ms',
    help: 'Connector egress latency per connector type',
    labelNames: ['connector_type'],
    buckets: [10, 50, 100, 500, 1000, 5000, 10000],
  });

/**
 * Metric collector tracking worker job outcomes, latency, active job counts, and egress connector performance.
 */
export class WorkerMetrics {
  constructor(
    _metricsRegistry?: any,
    private readonly logger?: any
  ) {}

  public recordJobProcessed(_deliveryId: string, durationMs: number, success: boolean): void {
    workerJobsTotalCounter.inc({ status: success ? 'success' : 'failure' });
    workerJobDurationHistogram.observe(durationMs);
    this.logger?.debug?.(`[WorkerMetrics] Recorded job processing (duration: ${durationMs}ms, success: ${success})`);
  }

  public recordJobError(_deliveryId: string, _error: Error | any): void {
    workerJobErrorsCounter.inc();
  }

  public recordConnectorCall(connectorType: string, durationMs: number): void {
    connectorLatencyHistogram.observe({ connector_type: connectorType }, durationMs);
  }

  public recordRetry(_deliveryId: string): void {
    workerRetryCounter.inc();
  }

  public recordDLQ(_deliveryId: string, _reason?: string): void {
    workerDLQCounter.inc();
  }

  public setActiveJobs(count: number): void {
    workerActiveJobsGauge.set(Math.max(0, count));
  }
}
