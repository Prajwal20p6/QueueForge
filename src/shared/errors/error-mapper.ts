import { BaseError } from './base-error';
import { ValidationError } from './validation-error';
import { NotFoundError } from './not-found-error';
import { AuthenticationError } from './authentication-error';
import { AuthorizationError } from './authorization-error';
import { RateLimitError } from './rate-limit-error';
import { ConflictError } from './conflict-error';
import { InternalError } from './internal-error';

/**
 * Mapper converting any unhandled throw to structured BaseError classes.
 */
export class ErrorMapper {
  /**
   * Translates arbitrary caught error variables into base application errors.
   */
  public static map(err: any): BaseError {
    if (err instanceof BaseError) return err;

    if (err.name === 'ValidationError' || err.name === 'ZodError') {
      return new ValidationError(err.message || 'Validation failed');
    }
    if (err.name === 'NotFoundError') {
      return new NotFoundError(err.message || 'Resource not found');
    }
    if (err.name === 'AuthenticationError' || err.name === 'JsonWebTokenError') {
      return new AuthenticationError(err.message || 'Unauthenticated request');
    }
    if (err.name === 'AuthorizationError') {
      return new AuthorizationError(err.message || 'Forbidden request');
    }
    if (err.name === 'RateLimitError') {
      return new RateLimitError(err.message || 'Too many requests');
    }
    if (err.name === 'ConflictError') {
      return new ConflictError(err.message || 'State conflict detected');
    }

    return new InternalError(err.message || 'An unexpected error occurred');
  }
}
