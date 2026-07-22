import { DomainError } from '../../../../src/domain/errors/domain-error';
import { InvalidDeliveryStateError } from '../../../../src/domain/errors/invalid-delivery-state-error';
import { MaxRetriesExceededError } from '../../../../src/domain/errors/max-retries-exceeded-error';
import { DestinationUnavailableError } from '../../../../src/domain/errors/destination-unavailable-error';
import { IdempotencyConflictError } from '../../../../src/domain/errors/idempotency-conflict-error';
import { DeliveryTimeoutError } from '../../../../src/domain/errors/delivery-timeout-error';
import { DeliveryStatus } from '../../../../src/domain/value-objects/delivery-status.vo';

describe('Domain Errors Unit Tests', () => {
  it('should serialize InvalidDeliveryStateError to JSON and string correctly', () => {
    const err = new InvalidDeliveryStateError(DeliveryStatus.PENDING, DeliveryStatus.COMPLETED);
    expect(err).toBeInstanceOf(DomainError);
    expect(err.statusCode).toBe(400);
    expect(err.message).toContain('cannot transition to');
    expect(err.toJSON().name).toBe('InvalidDeliveryStateError');
  });

  it('should serialize MaxRetriesExceededError correctly', () => {
    const err = new MaxRetriesExceededError('del-123', 5, 6);
    expect(err.statusCode).toBe(400);
    expect(err.message).toContain('del-123 exceeded max retries (5)');
  });

  it('should serialize DestinationUnavailableError correctly', () => {
    const err = new DestinationUnavailableError('dest-1', 'Circuit breaker open');
    expect(err.statusCode).toBe(503);
  });

  it('should serialize IdempotencyConflictError correctly', () => {
    const err = new IdempotencyConflictError('res-1', 'dest-1', 'del-existing');
    expect(err.statusCode).toBe(409);
  });

  it('should serialize DeliveryTimeoutError correctly', () => {
    const err = new DeliveryTimeoutError('del-123', 30000);
    expect(err.statusCode).toBe(408);
  });
});
