import { BaseError } from './base-error';
import { ErrorCode } from '../constants/error-codes';
import { HttpStatus } from '../constants/http-status';

/**
 * Error thrown when credentials are valid but permissions are lacking (HTTP 403)
 */
export class AuthorizationError extends BaseError {
  /**
   * Creates an AuthorizationError.
   * @param message - Detailed message.
   * @param context - Additional debug context.
   */
  constructor(message: string, context?: Record<string, any>) {
    super(ErrorCode.UNAUTHORIZED, HttpStatus.FORBIDDEN, message, context);
  }
}
