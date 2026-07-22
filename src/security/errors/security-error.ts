import { BaseError } from '../../shared/errors/base-error';
import { ErrorCode } from '../../shared/constants/error-codes';

/**
 * Abstract base class for all security layer exceptions within QueueForge.
 */
export abstract class SecurityError extends BaseError {
  constructor(message: string, statusCode: number = 401, details?: any) {
    const errCode = statusCode === 403 ? ErrorCode.UNAUTHORIZED : ErrorCode.UNAUTHENTICATED;
    super(errCode, statusCode, message, details);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
