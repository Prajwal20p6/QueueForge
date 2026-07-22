import { DomainError } from '../../../../src/domain/errors/domain-error';
import { ValidationError } from '../../../../src/domain/errors/validation-error';
import { DeliveryError } from '../../../../src/domain/errors/delivery-error';
import { StateError } from '../../../../src/domain/errors/state-error';
import { NotFoundError } from '../../../../src/domain/errors/not-found-error';

describe('Domain Errors Unit Tests', () => {
  it('should construct DomainError with code, message, and details serialization', () => {
    const err = new DomainError('CUSTOM_ERR', 'Something happened', { foo: 'bar' });

    expect(err).toBeInstanceOf(Error);
    expect(err.getCode()).toBe('CUSTOM_ERR');
    expect(err.message).toBe('Something happened');
    expect(err.getDetails()).toEqual({ foo: 'bar' });
    expect(err.toJSON()).toEqual({
      code: 'CUSTOM_ERR',
      message: 'Something happened',
      details: { foo: 'bar' },
    });
    expect(err.stack).toBeDefined();
  });

  it('should construct ValidationError with field property', () => {
    const err = new ValidationError('email', 'Invalid format');

    expect(err).toBeInstanceOf(DomainError);
    expect(err.getCode()).toBe('VALIDATION_FAILED');
    expect(err.getField()).toBe('email');
    expect(err.getDetails()).toEqual({ field: 'email' });
  });

  it('should construct DeliveryError with deliveryId and retryable status', () => {
    const err = new DeliveryError('delivery-123', 'Timeout', true);

    expect(err).toBeInstanceOf(DomainError);
    expect(err.getDeliveryId()).toBe('delivery-123');
    expect(err.isRetryable()).toBe(true);
  });

  it('should construct StateError with currentState and transition', () => {
    const err = new StateError('pending', 'completed', 'Illegal transition path');

    expect(err).toBeInstanceOf(DomainError);
    expect(err.getCurrentState()).toBe('pending');
    expect(err.getAttemptedTransition()).toBe('completed');
  });

  it('should construct NotFoundError with entityType and entityId', () => {
    const err = new NotFoundError('Destination', 'dest-777');

    expect(err).toBeInstanceOf(DomainError);
    expect(err.getEntityType()).toBe('Destination');
    expect(err.getEntityId()).toBe('dest-777');
  });
});
