/**
 * Mathematical utilities calculating backoff delays (exponential, linear, fixed, jittered) for retrying failed operations.
 */
export class BackoffCalculator {
  /**
   * Calculates exponential backoff delay capped at maxDelayMs.
   */
  public static exponentialBackoff(
    attempt: number,
    baseDelayMs: number = 1000,
    maxDelayMs: number = 60000,
    jitterFactor: number = 0.2
  ): number {
    const attemptIndex = Math.max(0, attempt - 1);
    const rawDelay = baseDelayMs * Math.pow(2, attemptIndex);
    const jitter = rawDelay * (Math.random() * jitterFactor);
    return Math.floor(Math.min(rawDelay + jitter, maxDelayMs));
  }

  /**
   * Calculates linear backoff delay (delayMs * attempt) capped at maxDelayMs.
   */
  public static linearBackoff(
    attempt: number,
    delayMs: number = 1000,
    maxDelayMs: number = 60000
  ): number {
    const attemptIndex = Math.max(1, attempt);
    return Math.floor(Math.min(delayMs * attemptIndex, maxDelayMs));
  }

  /**
   * Calculates fixed constant backoff delay.
   */
  public static fixedBackoff(delayMs: number = 1000): number {
    return Math.floor(Math.max(0, delayMs));
  }

  /**
   * Calculates exponential backoff with randomized full jitter.
   */
  public static exponentialBackoffWithJitter(
    attempt: number,
    baseDelayMs: number = 1000,
    maxDelayMs: number = 60000,
    jitterFactor: number = 0.2
  ): number {
    return BackoffCalculator.exponentialBackoff(attempt, baseDelayMs, maxDelayMs, jitterFactor);
  }
}
