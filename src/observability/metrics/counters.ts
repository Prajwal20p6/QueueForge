import client from 'prom-client';
import { Logger } from '../logging/logger';

/**
 * Thread-safe wrapper class organizing all Counter metric operations in prom-client.
 */
export class CounterMetrics {
  // Counter definitions
  private readonly resultsIngested: client.Counter;
  private readonly resultsCompleted: client.Counter;
  private readonly resultsFailedDlq: client.Counter;
  private readonly deliveryAttempts: client.Counter;
  private readonly deliveryCompleted: client.Counter;
  private readonly deliveryFailed: client.Counter;
  private readonly deliveryMovedToDlq: client.Counter;
  private readonly retryScheduled: client.Counter;
  private readonly retryExhausted: client.Counter;
  private readonly workerCrashes: client.Counter;
  private readonly circuitBreakerOpened: client.Counter;
  private readonly circuitBreakerClosed: client.Counter;
  private readonly authSuccess: client.Counter;
  private readonly authFailure: client.Counter;
  private readonly validationSuccess: client.Counter;
  private readonly validationFailure: client.Counter;
  private readonly rateLimitHits: client.Counter;
  private readonly rateLimitViolations: client.Counter;

  constructor(_meter: any, _logger: Logger) {

    this.resultsIngested = this.getOrRegisterCounter({
      name: 'results_ingested_total',
      help: 'Total number of result packages ingested',
      labelNames: ['agent_id'],
    });

    this.resultsCompleted = this.getOrRegisterCounter({
      name: 'results_completed_total',
      help: 'Total number of results successfully completed',
      labelNames: ['agent_id'],
    });

    this.resultsFailedDlq = this.getOrRegisterCounter({
      name: 'results_failed_dlq_total',
      help: 'Total number of results failing and moved to DLQ',
      labelNames: ['agent_id'],
    });

    this.deliveryAttempts = this.getOrRegisterCounter({
      name: 'delivery_attempts_total',
      help: 'Total number of delivery attempts made',
      labelNames: ['destination_type'],
    });

    this.deliveryCompleted = this.getOrRegisterCounter({
      name: 'delivery_completed_total',
      help: 'Total number of deliveries successfully completed',
      labelNames: ['destination_type'],
    });

    this.deliveryFailed = this.getOrRegisterCounter({
      name: 'delivery_failed_total',
      help: 'Total number of delivery attempts failing',
      labelNames: ['destination_type', 'error_code'],
    });

    this.deliveryMovedToDlq = this.getOrRegisterCounter({
      name: 'delivery_moved_to_dlq_total',
      help: 'Total number of delivery targets moved to DLQ',
      labelNames: ['destination_type'],
    });

    this.retryScheduled = this.getOrRegisterCounter({
      name: 'retry_scheduled_total',
      help: 'Total number of retries scheduled',
      labelNames: ['retry_count'],
    });

    this.retryExhausted = this.getOrRegisterCounter({
      name: 'retry_exhausted_total',
      help: 'Total number of retries completely exhausted',
      labelNames: ['destination_type'],
    });

    this.workerCrashes = this.getOrRegisterCounter({
      name: 'worker_crashes_total',
      help: 'Total number of worker processing engine crashes',
      labelNames: ['queue_name'],
    });

    this.circuitBreakerOpened = this.getOrRegisterCounter({
      name: 'circuit_breaker_opened_total',
      help: 'Total number of circuit breaker opens',
      labelNames: ['destination_id'],
    });

    this.circuitBreakerClosed = this.getOrRegisterCounter({
      name: 'circuit_breaker_closed_total',
      help: 'Total number of circuit breaker closes',
      labelNames: ['destination_id'],
    });

    this.authSuccess = this.getOrRegisterCounter({
      name: 'auth_success_total',
      help: 'Total number of successful authentication requests',
      labelNames: ['auth_type'],
    });

    this.authFailure = this.getOrRegisterCounter({
      name: 'auth_failure_total',
      help: 'Total number of failed authentication requests',
      labelNames: ['auth_type', 'reason'],
    });

    this.validationSuccess = this.getOrRegisterCounter({
      name: 'validation_success_total',
      help: 'Total number of successful validations',
    });

    this.validationFailure = this.getOrRegisterCounter({
      name: 'validation_failure_total',
      help: 'Total number of failed validations',
    });

    this.rateLimitHits = this.getOrRegisterCounter({
      name: 'rate_limit_hits_total',
      help: 'Total number of rate limiter checks executed',
    });

    this.rateLimitViolations = this.getOrRegisterCounter({
      name: 'rate_limit_violations_total',
      help: 'Total number of rate limit breaches triggered',
    });
  }

  /**
   * Helper utility registering a new Counter or returning an existing one if registered.
   */
  private getOrRegisterCounter(opts: client.CounterConfiguration<string>): client.Counter {
    return (
      (client.register.getSingleMetric(opts.name) as client.Counter) ||
      new client.Counter(opts)
    );
  }

  public incrementResultsIngested(count = 1, labels?: { agent_id?: string }): void {
    this.resultsIngested.inc(labels || {}, count);
  }

  public incrementResultsCompleted(count = 1, labels?: { agent_id?: string }): void {
    this.resultsCompleted.inc(labels || {}, count);
  }

  public incrementResultsFailedDlq(count = 1, labels?: { agent_id?: string }): void {
    this.resultsFailedDlq.inc(labels || {}, count);
  }

  public incrementDeliveryAttempts(count = 1, labels?: { destination_type?: string }): void {
    this.deliveryAttempts.inc(labels || {}, count);
  }

  public incrementDeliveryCompleted(count = 1, labels?: { destination_type?: string }): void {
    this.deliveryCompleted.inc(labels || {}, count);
  }

  public incrementDeliveryFailed(count = 1, labels?: { destination_type?: string; error_code?: string }): void {
    this.deliveryFailed.inc(labels || {}, count);
  }

  public incrementDeliveryMovedToDlq(count = 1, labels?: { destination_type?: string }): void {
    this.deliveryMovedToDlq.inc(labels || {}, count);
  }

  public incrementRetryScheduled(count = 1, labels?: { retry_count?: number }): void {
    const stringifiedLabels = labels ? { retry_count: String(labels.retry_count) } : {};
    this.retryScheduled.inc(stringifiedLabels, count);
  }

  public incrementRetryExhausted(count = 1, labels?: { destination_type?: string }): void {
    this.retryExhausted.inc(labels || {}, count);
  }

  public incrementWorkerCrashes(count = 1, labels?: { queue_name?: string }): void {
    this.workerCrashes.inc(labels || {}, count);
  }

  public incrementCircuitBreakerOpened(count = 1, labels?: { destination_id?: string }): void {
    this.circuitBreakerOpened.inc(labels || {}, count);
  }

  public incrementCircuitBreakerClosed(count = 1, labels?: { destination_id?: string }): void {
    this.circuitBreakerClosed.inc(labels || {}, count);
  }

  public incrementAuthSuccess(count = 1, labels?: { auth_type?: string }): void {
    this.authSuccess.inc(labels || {}, count);
  }

  public incrementAuthFailure(count = 1, labels?: { auth_type?: string; reason?: string }): void {
    this.authFailure.inc(labels || {}, count);
  }

  public incrementValidationSuccess(count = 1): void {
    this.validationSuccess.inc(count);
  }

  public incrementValidationFailure(count = 1): void {
    this.validationFailure.inc(count);
  }

  public incrementRateLimitHits(count = 1): void {
    this.rateLimitHits.inc(count);
  }

  public incrementRateLimitViolations(count = 1): void {
    this.rateLimitViolations.inc(count);
  }
}
