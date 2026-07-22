import { BaseError } from './base-error';
import { ErrorCode } from '../constants/error-codes';
import { HttpStatus } from '../constants/http-status';

/**
 * Error representing failure to process or deliver after all retry loops are exhausted
 */
export class RetryExhaustedError extends BaseError {
  /**
   * Creates a RetryExhaustedError.
   * @param message - Detailed message.
   * @param context - Additional debug context (e.g. attemptCount, maxAttempts).
   */
  constructor(message: string, context?: Record<string, any>) {
    super(ErrorCode.MAX_RETRIES_EXCEEDED, HttpStatus.SERVER_ERROR, message, context);
  }
}
