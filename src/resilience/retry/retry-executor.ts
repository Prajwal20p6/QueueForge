import { RetryPolicy } from './retry-policy';
import { RetryMetrics } from './retry-metrics';
import { TimeoutError } from '../errors/timeout-error';

/**
 * Execution engine wrapping asynchronous functions with configurable retry loops, delay backoff, and tracing.
 */
export class RetryExecutor {
  public readonly metrics: RetryMetrics;

  constructor(
    public readonly policy: RetryPolicy = new RetryPolicy(),
    logger?: any,
    private readonly observability?: any
  ) {
    this.metrics = new RetryMetrics();
    if (logger) {
      // logger reference
    }
  }

  /**
   * Executes an asynchronous task with automated retry retries based on configured policy rules.
   */
  public async execute<T>(
    fn: () => Promise<T>,
    context?: { deliveryId?: string; attempt?: number }
  ): Promise<T> {
    const startTime = Date.now();
    let currentAttempt = context?.attempt || 1;
    const tracer = this.observability?.tracer;

    while (currentAttempt <= this.policy.maxAttempts) {
      this.metrics.recordAttempt(currentAttempt);
      const span = tracer?.startSpan?.(`retry.attempt_${currentAttempt}`);

      try {
        if (this.policy.timeout > 0 && Date.now() - startTime > this.policy.timeout) {
          throw new TimeoutError('RetryExecution', this.policy.timeout);
        }

        const result = await fn();
        const durationMs = Date.now() - startTime;
        this.metrics.recordSuccess(currentAttempt, durationMs);
        span?.setStatus?.({ code: 1 });
        return result;
      } catch (err: any) {
        span?.recordException?.(err);
        span?.setStatus?.({ code: 2, message: err.message });
        this.metrics.recordFailure(currentAttempt, err);

        const shouldRetry = this.policy.shouldRetry(err, currentAttempt);
        const isTimeRemaining = this.policy.timeout === 0 || Date.now() - startTime < this.policy.timeout;

        if (shouldRetry && isTimeRemaining) {
          const delayMs = this.policy.getNextDelay(currentAttempt);
          this.metrics.recordDelay(delayMs);
          await this.delay(delayMs);
          currentAttempt++;
        } else {
          this.metrics.recordMaxRetriesExceeded();
          throw err;
        }
      } finally {
        span?.end?.();
      }
    }

    throw new Error('Retry loop terminated unexpectedly');
  }

  public async executeWithMetrics<T>(
    fn: () => Promise<T>
  ): Promise<{ result: T; attempts: number; totalDuration: number }> {
    const startTime = Date.now();
    let attemptsCount = 0;

    const wrapped = async () => {
      attemptsCount++;
      return await fn();
    };

    const result = await this.execute(wrapped);
    return {
      result,
      attempts: attemptsCount,
      totalDuration: Date.now() - startTime,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
