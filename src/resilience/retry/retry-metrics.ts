export interface RetryMetricsData {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  firstAttemptSuccesses: number;
  retriedSuccesses: number;
  maxRetriesExceeded: number;
  totalDelayMs: number;
}

/**
 * Metric collector recording retry attempts, delay times, and success rates.
 */
export class RetryMetrics {
  private totalAttempts = 0;
  private successfulAttempts = 0;
  private failedAttempts = 0;
  private firstAttemptSuccesses = 0;
  private retriedSuccesses = 0;
  private maxRetriesExceeded = 0;
  private totalDelayMs = 0;

  public recordAttempt(_attemptNumber: number): void {
    this.totalAttempts++;
  }

  public recordSuccess(attemptNumber: number, _durationMs: number): void {
    this.successfulAttempts++;
    if (attemptNumber === 1) {
      this.firstAttemptSuccesses++;
    } else {
      this.retriedSuccesses++;
    }
  }

  public recordFailure(_attemptNumber: number, _error: Error): void {
    this.failedAttempts++;
  }

  public recordMaxRetriesExceeded(): void {
    this.maxRetriesExceeded++;
  }

  public recordDelay(delayMs: number): void {
    this.totalDelayMs += delayMs;
  }

  public getMetrics(): RetryMetricsData {
    return {
      totalAttempts: this.totalAttempts,
      successfulAttempts: this.successfulAttempts,
      failedAttempts: this.failedAttempts,
      firstAttemptSuccesses: this.firstAttemptSuccesses,
      retriedSuccesses: this.retriedSuccesses,
      maxRetriesExceeded: this.maxRetriesExceeded,
      totalDelayMs: this.totalDelayMs,
    };
  }

  public reset(): void {
    this.totalAttempts = 0;
    this.successfulAttempts = 0;
    this.failedAttempts = 0;
    this.firstAttemptSuccesses = 0;
    this.retriedSuccesses = 0;
    this.maxRetriesExceeded = 0;
    this.totalDelayMs = 0;
  }
}
