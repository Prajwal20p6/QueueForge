import { BaseError } from './base-error';
import { ErrorCode } from '../constants/error-codes';
import { HttpStatus } from '../constants/http-status';

/**
 * Error thrown when a requested resource (e.g., specific destination or task) is not found
 */
export class NotFoundError extends BaseError {
  /**
   * Creates a NotFoundError.
   * @param message - Detailed message.
   * @param context - Additional debug context.
   */
  constructor(message: string, context?: Record<string, any>) {
    super(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, message, context);
  }
}
