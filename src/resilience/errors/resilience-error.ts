import { BaseError } from '../../shared/errors/base-error';
import { ErrorCode } from '../../shared/constants/error-codes';
import { HttpStatus } from '../../shared/constants/http-status';

/**
 * Abstract base class for all resilience layer errors.
 */
export abstract class ResilienceError extends BaseError {
  constructor(
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    statusCode: number = 503,
    message: string,
    context?: Record<string, any>
  ) {
    super(code, statusCode as HttpStatus, message, context);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
