import { BaseError } from './base-error';
import { ErrorCode } from '../constants/error-codes';
import { HttpStatus } from '../constants/http-status';

/**
 * Error representing failure to deliver task results to target destinations
 */
export class DeliveryError extends BaseError {
  /**
   * Creates a DeliveryError.
   * @param message - Detailed error message.
   * @param code - Specific code, defaults to ErrorCode.DELIVERY_FAILED.
   * @param context - Additional debugging variables.
   */
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.DELIVERY_FAILED,
    context?: Record<string, any>
  ) {
    super(code, HttpStatus.SERVER_ERROR, message, context);
  }
}
