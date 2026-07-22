import { InvalidDeliveryStateError } from '../../../../src/domain/errors/invalid-delivery-state-error';
import { DeliveryStatus } from '../../../../src/domain/value-objects/delivery-status.vo';

describe('InvalidDeliveryStateError Unit Tests', () => {
  it('should format message and status code correctly', () => {
    const err = new InvalidDeliveryStateError(DeliveryStatus.COMPLETED, DeliveryStatus.PROCESSING);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Delivery in status "COMPLETED" cannot transition to "PROCESSING".');
    expect(err.context).toEqual({
      currentStatus: DeliveryStatus.COMPLETED,
      attemptedTransition: DeliveryStatus.PROCESSING,
    });
  });
});
