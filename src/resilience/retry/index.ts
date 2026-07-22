import client from 'prom-client';
import { ResilienceConfig } from '../../config/resilience';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';
import { calculateExponentialBackoff } from './exponential-backoff';
import { getRetryConfig } from './config';

export * from './backoff-calculator';
export * from './retry-policy';
export * from './retry-metrics';
export * from './retry-executor';
export * from './config';
export * from './exponential-backoff';
export * from './retry-scheduler';

// Register prometheus metrics counters and histograms
export const retryAttemptsCounter =
  (client.register.getSingleMetric('retry_attempts_total') as client.Counter) ||
  new client.Counter({
    name: 'retry_attempts_total',
    help: 'Total number of delivery retry executions',
  });

export const retryDelaysHistogram =
  (client.register.getSingleMetric('retry_delays_seconds') as client.Histogram) ||
  new client.Histogram({
    name: 'retry_delays_seconds',
    help: 'Distribution of retry backoff delay durations in seconds',
    buckets: [1, 5, 15, 30, 60, 180, 300],
  });

/**
 * Engine calculating backoff durations, classifying HTTP status codes retryability,
 * and increments metrics tracking.
 */
export class RetryEngine {
  private readonly retryableErrors = new Set<string>([
    'ECONNRESET',
    'ETIMEDOUT',
    'EADDRINUSE',
    'ECONNREFUSED',
    'Connection Timeout',
  ]);

  constructor(
    private readonly config: ResilienceConfig,
    _logger: Logger,
    _metrics: any
  ) {}

  /**
   * Calculates backoff duration utilizing exponential scaling and jitter options.
   */
  public calculateBackoff(retryCount: number): number {
    const params = getRetryConfig(this.config);
    const delay = calculateExponentialBackoff(
      retryCount,
      params.baseMs,
      params.maxMs,
      params.jitterFactor
    );
    retryDelaysHistogram.observe(delay / 1000);
    return delay;
  }

  /**
   * Checks if an error status code or failure exception is retryable.
   */
  public isRetryable(error: any): boolean {
    if (!error) return false;
    if (typeof error.isRetryable === 'function') {
      return error.isRetryable();
    }
    const status = error.statusCode || error.status;
    if (status) {
      return status === 429 || status === 408 || (status >= 500 && status <= 599);
    }
    const msg = error.message || String(error);
    return Array.from(this.retryableErrors).some(errStr => msg.includes(errStr));
  }
}
