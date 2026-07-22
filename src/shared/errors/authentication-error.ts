import { BaseError } from './base-error';
import { ErrorCode } from '../constants/error-codes';
import { HttpStatus } from '../constants/http-status';

/**
 * Error thrown when incoming requests fail credentials verification (HTTP 401)
 */
export class AuthenticationError extends BaseError {
  /**
   * Creates an AuthenticationError.
   * @param message - Detailed message.
   * @param context - Additional debug context.
   */
  constructor(message: string, context?: Record<string, any>) {
    super(ErrorCode.UNAUTHENTICATED, HttpStatus.UNAUTHORIZED, message, context);
  }
}
