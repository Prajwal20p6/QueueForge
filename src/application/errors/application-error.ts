import { BaseError } from '../../shared/errors/base-error';
import { ErrorCode } from '../../shared/constants/error-codes';
import { HttpStatus } from '../../shared/constants/http-status';

/**
 * Abstract base class for all Application Layer errors.
 */
export abstract class ApplicationError extends BaseError {
  constructor(
    code: ErrorCode,
    statusCode: HttpStatus,
    message: string,
    context?: Record<string, any>
  ) {
    super(code, statusCode, message, context);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}
