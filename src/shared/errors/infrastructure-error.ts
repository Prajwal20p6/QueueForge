import { BaseError } from './base-error';
import { ErrorCode } from '../constants/error-codes';
import { HttpStatus } from '../constants/http-status';

/**
 * Error thrown when backing infrastructure components (Postgres, Redis, BullMQ) encounter issues
 */
export class InfrastructureError extends BaseError {
  /**
   * Creates an InfrastructureError.
   * @param message - Detailed error message.
   * @param code - Naming code (e.g. DB_CONNECTION_FAILED, REDIS_CONNECTION_FAILED).
   * @param context - Additional debugging variables.
   */
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    context?: Record<string, any>
  ) {
    super(code, HttpStatus.SERVER_ERROR, message, context);
  }
}
