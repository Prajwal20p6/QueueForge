import { BaseError } from './base-error';
import { ErrorCode } from '../constants/error-codes';
import { HttpStatus } from '../constants/http-status';

/**
 * Error thrown when there is a state conflict in the domain (e.g. duplicate UUID resource registration)
 */
export class ConflictError extends BaseError {
  constructor(message: string, context?: Record<string, any>) {
    super('CONFLICT_DETECTED' as ErrorCode, 409 as HttpStatus, message, context);
  }
}
export { ConflictError as DuplicateResourceError };
