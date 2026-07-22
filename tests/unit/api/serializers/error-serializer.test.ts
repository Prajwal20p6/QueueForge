import { ErrorSerializer } from '../../../../src/api/serializers/error-serializer';
import { ValidationError } from '../../../../src/shared/errors/validation-error';
import { NotFoundError } from '../../../../src/shared/errors/not-found-error';

describe('ErrorSerializer Unit Tests', () => {
  it('should serialize ValidationError correctly with 422', () => {
    const err = new ValidationError('email', 'Invalid email address');
    const { statusCode, payload } = ErrorSerializer.serialize(err, 'trace-123');

    expect(statusCode).toBe(422);
    expect(payload.error).toBe('Unprocessable Entity');
    expect(payload.traceId).toBe('trace-123');
  });

  it('should serialize NotFoundError correctly with 404', () => {
    const err = new NotFoundError('Resource missing');
    const { statusCode, payload } = ErrorSerializer.serialize(err, 'trace-123');

    expect(statusCode).toBe(404);
    expect(payload.error).toBe('Not Found');
    expect(payload.message).toBe('Resource missing');
  });

  it('should serialize generic Error as 500 Internal Server Error', () => {
    const err = new Error('Unexpected crash');
    const { statusCode, payload } = ErrorSerializer.serialize(err, 'trace-123');

    expect(statusCode).toBe(500);
    expect(payload.error).toBe('Internal Server Error');
  });
});
