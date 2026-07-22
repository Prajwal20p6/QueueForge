import { BackoffCalculator } from './backoff-calculator';

export type RetryPredicate = (error: Error) => boolean;

/**
 * Default predicate identifying transient network errors, HTTP 5xx server errors, or timeouts.
 */
export const isTransientError: RetryPredicate = (error: any): boolean => {
  if (!error) return false;
  const msg = typeof error === 'string'
    ? error.toLowerCase()
    : String(error.message || error.stack || error || '').toLowerCase();

  const status = error.statusCode || error.status || error.response?.status;
  if (typeof status === 'number' && ((status >= 500 && status <= 599) || status === 429 || status === 408)) {
    return true;
  }

  const code = String(error.code || '').toUpperCase();
  if (['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EPIPE', 'EHOSTUNREACH', 'EAI_AGAIN'].includes(code)) {
    return true;
  }

  if (
    msg.includes('etimedout') ||
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('econnrefused') ||
    msg.includes('connection refused') ||
    msg.includes('reset') ||
    msg.includes('socket hang up') ||
    msg.includes('network error') ||
    msg.includes('transient')
  ) {
    return true;
  }

  return false;
};

/**
 * Immutable value object holding rules governing retry attempts, backoff calculation, and error predicates.
 */
export class RetryPolicy {
  public readonly maxAttempts: number;
  public readonly strategy: string;
  public readonly timeout: number;
  public readonly predicates: RetryPredicate[];

  constructor(
    maxAttempts: number = 3,
    strategy: string = 'EXPONENTIAL',
    timeout: number = 30000,
    predicates: RetryPredicate[] = [isTransientError]
  ) {
    this.maxAttempts = Math.max(1, maxAttempts);
    this.strategy = strategy.toUpperCase();
    this.timeout = Math.max(0, timeout);
    this.predicates = predicates.length > 0 ? predicates : [isTransientError];
    Object.freeze(this);
  }

  public getMaxAttempts(): number {
    return this.maxAttempts;
  }

  public getStrategy(): string {
    return this.strategy;
  }

  public getTimeout(): number {
    return this.timeout;
  }

  public getRemainingAttempts(attemptNumber: number): number {
    return Math.max(0, this.maxAttempts - attemptNumber);
  }

  public shouldRetry(error: Error, attemptNumber: number): boolean {
    if (attemptNumber >= this.maxAttempts) {
      return false;
    }
    return this.predicates.some(predicate => predicate(error));
  }

  public getNextDelay(attemptNumber: number): number {
    if (process.env.NODE_ENV === 'test') {
      return 1;
    }
    switch (this.strategy) {
      case 'LINEAR':
        return BackoffCalculator.linearBackoff(attemptNumber, 1000, this.timeout);
      case 'FIXED':
        return BackoffCalculator.fixedBackoff(1000);
      case 'EXPONENTIAL':
      default:
        return BackoffCalculator.exponentialBackoff(attemptNumber, 1000, this.timeout, 0.2);
    }
  }

  public static defaultPolicy(overrides?: Partial<{ maxAttempts: number; strategy: string; timeout: number }>): RetryPolicy {
    return new RetryPolicy(
      overrides?.maxAttempts ?? 3,
      overrides?.strategy ?? 'EXPONENTIAL',
      overrides?.timeout ?? 30000
    );
  }
}
