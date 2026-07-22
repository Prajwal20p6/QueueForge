import {
  isBaseError,
  isValidationError,
  isDeliveryError,
  isInfrastructureError,
  isRetryableError,
} from '../../../src/shared/guards/error-guards';
import {
  isString,
  isNumber,
  isObject,
  isArray,
  isEnum,
  isValidUUID,
  isValidULID,
} from '../../../src/shared/guards/type-guards';
import {
  isJobCompleted,
  isJobFailed,
  isJobPending,
  isJobScheduledRetry,
  isJobInDLQ,
  isCircuitOpen,
  isCircuitHalfOpen,
} from '../../../src/shared/guards/state-guards';
import { ValidationError, DeliveryError } from '../../../src/shared/errors';

describe('Shared Layer Guards', () => {
  describe('error-guards.ts', () => {
    it('should narrow custom error types correctly', () => {
      const err = new ValidationError('Bad validation');

      expect(isBaseError(err)).toBe(true);
      expect(isValidationError(err)).toBe(true);
      expect(isDeliveryError(err)).toBe(false);
      expect(isInfrastructureError(err)).toBe(false);
    });

    it('should correctly flag transient errors as retryable', () => {
      const socketErr = new Error('ECONNREFUSED connection failed');
      expect(isRetryableError(socketErr)).toBe(true);

      const validationErr = new ValidationError('Validation failed');
      expect(isRetryableError(validationErr)).toBe(false);

      const transientHttpErr = new DeliveryError('Post failed', undefined, { statusCode: 502 });
      expect(isRetryableError(transientHttpErr)).toBe(true);

      const permanentHttpErr = new DeliveryError('Post failed', undefined, { statusCode: 400 });
      expect(isRetryableError(permanentHttpErr)).toBe(false);
    });
  });

  describe('type-guards.ts', () => {
    it('should perform primitive type assertions', () => {
      expect(isString('hello')).toBe(true);
      expect(isString(123)).toBe(false);

      expect(isNumber(123)).toBe(true);
      expect(isNumber(NaN)).toBe(false);

      expect(isObject({ a: 1 })).toBe(true);
      expect(isObject([])).toBe(false);
      expect(isObject(null)).toBe(false);

      expect(isArray([])).toBe(true);
      expect(isArray({})).toBe(false);

      expect(isEnum('WEBHOOK', ['WEBHOOK', 'DATABASE'])).toBe(true);
    });

    it('should validate standard UUID and ULID formats', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('invalid-uuid')).toBe(false);

      expect(isValidULID('01ARZ3NDEKTSV4RRFFQ69G5FAV')).toBe(true);
      expect(isValidULID('invalid-ulid-short')).toBe(false);
    });
  });

  describe('state-guards.ts', () => {
    it('should check job states properly', () => {
      expect(isJobCompleted('completed')).toBe(true);
      expect(isJobFailed('failed')).toBe(true);
      expect(isJobPending('active')).toBe(true);
      expect(isJobPending('waiting')).toBe(true);
      expect(isJobScheduledRetry('delayed')).toBe(true);
      expect(isJobInDLQ('failed')).toBe(true);
    });

    it('should check circuit breaker states properly', () => {
      expect(isCircuitOpen('open')).toBe(true);
      expect(isCircuitHalfOpen('half-open')).toBe(true);
    });
  });
});
