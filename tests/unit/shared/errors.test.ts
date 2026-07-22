import {
  BaseError,
  ValidationError,
  DeliveryError,
  InfrastructureError,
  NotFoundError,
  RateLimitError,
  AuthenticationError,
  AuthorizationError,
  RetryExhaustedError,
} from '../../../src/shared/errors';
import { ErrorCode } from '../../../src/shared/constants/error-codes';
import { HttpStatus } from '../../../src/shared/constants/http-status';

describe('Shared Layer Error Classes', () => {
  it('should preserve correct prototype inheritance properties', () => {
    const error = new ValidationError('Bad request');

    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toBeInstanceOf(BaseError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Bad request');
    expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(error.statusCode).toBe(HttpStatus.VALIDATION_ERROR);
  });

  it('should correctly attach custom contexts and codes', () => {
    const context = { dbHost: 'localhost' };
    const err = new InfrastructureError(
      'Connection failed',
      ErrorCode.DB_CONNECTION_FAILED,
      context
    );

    expect(err).toBeInstanceOf(InfrastructureError);
    expect(err.code).toBe(ErrorCode.DB_CONNECTION_FAILED);
    expect(err.statusCode).toBe(HttpStatus.SERVER_ERROR);
    expect(err.context).toEqual(context);
  });

  it('should map individual HTTP status codes correctly', () => {
    const notFound = new NotFoundError('Task not found');
    expect(notFound.statusCode).toBe(HttpStatus.NOT_FOUND);

    const auth = new AuthenticationError('Unauthenticated');
    expect(auth.statusCode).toBe(HttpStatus.UNAUTHORIZED);

    const forbidden = new AuthorizationError('Forbidden');
    expect(forbidden.statusCode).toBe(HttpStatus.FORBIDDEN);

    const rate = new RateLimitError('Too many queries');
    expect(rate.statusCode).toBe(HttpStatus.RATE_LIMITED);

    const delivery = new DeliveryError('Post failed');
    expect(delivery.statusCode).toBe(HttpStatus.SERVER_ERROR);

    const maxRetry = new RetryExhaustedError('Max attempts hit');
    expect(maxRetry.statusCode).toBe(HttpStatus.SERVER_ERROR);
  });
});
