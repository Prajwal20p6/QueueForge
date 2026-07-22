import { BaseError } from './base-error';
import { ErrorCode } from '../constants/error-codes';
import { HttpStatus } from '../constants/http-status';

/**
 * Error representing rate limit exhaustion (Too Many Requests - HTTP 429)
 */
export class RateLimitError extends BaseError {
  /**
   * Creates a RateLimitError.
   * @param message - Detailed message.
   * @param context - Additional debug context (e.g. limit, resetTime).
   */
  constructor(message: string, context?: Record<string, any>) {
    super(ErrorCode.RATE_LIMITED, HttpStatus.RATE_LIMITED, message, context);
  }
}
