import client from 'prom-client';
import { Logger } from '../logging/logger';

/**
 * Thread-safe wrapper class organizing all Histogram metric operations in prom-client.
 */
export class HistogramMetrics {
  // Histogram definitions
  private readonly deliveryLatency: client.Histogram;
  private readonly ingestionLatency: client.Histogram;
  private readonly retryDelay: client.Histogram;
  private readonly recoveryDuration: client.Histogram;
  private readonly authLatency: client.Histogram;
  private readonly validationLatency: client.Histogram;

  constructor(_meter: any, _logger: Logger) {

    this.deliveryLatency = this.getOrRegisterHistogram({
      name: 'delivery_latency_seconds',
      help: 'Latency distribution of delivery attempts in seconds',
      labelNames: ['destination_type'],
      buckets: [0.1, 0.5, 1.0, 2.5, 5.0, 10.0],
    });

    this.ingestionLatency = this.getOrRegisterHistogram({
      name: 'ingestion_latency_seconds',
      help: 'Latency distribution of ingested results in seconds',
      labelNames: ['agent_id'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1.0, 5.0],
    });

    this.retryDelay = this.getOrRegisterHistogram({
      name: 'retry_delay_seconds',
      help: 'Distribution of retries wait times in seconds',
      buckets: [1.0, 5.0, 10.0, 30.0, 60.0, 300.0],
    });

    this.recoveryDuration = this.getOrRegisterHistogram({
      name: 'recovery_duration_seconds',
      help: 'Latency distribution of recovery cron sweeps in seconds',
      buckets: [0.1, 0.5, 1.0, 5.0, 10.0, 60.0],
    });

    this.authLatency = this.getOrRegisterHistogram({
      name: 'auth_latency_ms',
      help: 'Latency distribution of authentication processing in milliseconds',
      labelNames: ['auth_type'],
      buckets: [1, 5, 10, 25, 50, 100, 250, 500],
    });

    this.validationLatency = this.getOrRegisterHistogram({
      name: 'validation_latency_ms',
      help: 'Latency distribution of validation checks in milliseconds',
      buckets: [0.5, 1, 2.5, 5, 10, 25, 50],
    });
  }

  /**
   * Helper utility registering a new Histogram or returning an existing one if registered.
   */
  private getOrRegisterHistogram(opts: client.HistogramConfiguration<string>): client.Histogram {
    return (
      (client.register.getSingleMetric(opts.name) as client.Histogram) ||
      new client.Histogram(opts)
    );
  }

  public recordDeliveryLatency(latencyMs: number, labels?: { destination_type?: string }): void {
    // Record in seconds
    this.deliveryLatency.observe(labels || {}, latencyMs / 1000);
  }

  public recordIngestionLatency(latencyMs: number, labels?: { agent_id?: string }): void {
    // Record in seconds
    this.ingestionLatency.observe(labels || {}, latencyMs / 1000);
  }

  public recordRetryDelay(delayMs: number): void {
    // Record in seconds
    this.retryDelay.observe(delayMs / 1000);
  }

  public recordRecoveryDuration(durationMs: number): void {
    // Record in seconds
    this.recoveryDuration.observe(durationMs / 1000);
  }

  public recordAuthLatency(latencyMs: number, labels?: { auth_type?: string }): void {
    this.authLatency.observe(labels || {}, latencyMs);
  }

  public recordValidationLatency(latencyMs: number): void {
    this.validationLatency.observe(latencyMs);
  }
}
