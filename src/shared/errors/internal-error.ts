import { BaseError } from './base-error';
import { ErrorCode } from '../constants/error-codes';
import { HttpStatus } from '../constants/http-status';

/**
 * Error class wrapper for unhandled operational and connection server exceptions
 */
export class InternalError extends BaseError {
  constructor(message = 'An unexpected internal server error occurred', context?: Record<string, any>) {
    super(
      ErrorCode.UNKNOWN_ERROR,
      HttpStatus.SERVER_ERROR,
      process.env.NODE_ENV === 'production' ? 'An unexpected internal server error occurred' : message,
      context
    );
  }
}
export { InternalError as ServerError };
