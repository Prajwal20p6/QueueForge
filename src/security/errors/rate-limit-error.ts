import { SecurityError } from './security-error';

/**
 * Exception thrown when client requests exceed configured rate limiting thresholds or quota bounds.
 */
export class RateLimitError extends SecurityError {
  public readonly retryAfter: number;
  public readonly limit?: number;
  public readonly remaining?: number;
  public readonly resetTime?: Date;

  constructor(
    message: string = 'Rate limit exceeded. Too many requests.',
    retryAfterSeconds: number = 60,
    limit?: number,
    remaining?: number,
    resetTime?: Date
  ) {
    super(message, 429, { retryAfter: retryAfterSeconds, limit, remaining, resetTime });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfterSeconds;
    this.limit = limit;
    this.remaining = remaining;
    this.resetTime = resetTime;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}
