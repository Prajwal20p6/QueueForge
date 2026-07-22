import { Delivery } from '../../../../src/domain/entities/delivery.entity';
import { DeliveryStatus } from '../../../../src/domain/value-objects/delivery-status.vo';
import { DeliveryError, DeliveryErrorCategory } from '../../../../src/domain/value-objects/delivery-error.vo';
import { RetryAttempt } from '../../../../src/domain/value-objects/retry-attempt.vo';
import { RetryStrategyVO } from '../../../../src/domain/value-objects/retry-strategy.vo';
import { InvalidDeliveryStateError } from '../../../../src/domain/errors/invalid-delivery-state-error';

describe('Delivery Entity State Machine Unit Tests', () => {
  it('should transition PENDING -> PROCESSING -> COMPLETED correctly', () => {
    const delivery = Delivery.create('res-123', 'dest-456');
    expect(delivery.getStatus().getValue()).toBe(DeliveryStatus.PENDING);

    delivery.markAsProcessing();
    expect(delivery.getStatus().getValue()).toBe(DeliveryStatus.PROCESSING);

    delivery.markAsCompleted();
    expect(delivery.getStatus().getValue()).toBe(DeliveryStatus.COMPLETED);
    expect(delivery.getCompletedAt()).not.toBeNull();
  });

  it('should throw InvalidDeliveryStateError on invalid state transition PENDING -> COMPLETED', () => {
    const delivery = Delivery.create('res-123', 'dest-456');
    expect(() => delivery.markAsCompleted()).toThrow(InvalidDeliveryStateError);
  });

  it('should transition to SCHEDULED_RETRY on transient failure', () => {
    const delivery = Delivery.create('res-123', 'dest-456');
    delivery.markAsProcessing();

    const transientErr = new DeliveryError(DeliveryErrorCategory.TRANSIENT, '429 Rate Limit');
    delivery.markAsFailed(transientErr, RetryStrategyVO.exponential(1000, 30000), 5);

    expect(delivery.getStatus().getValue()).toBe(DeliveryStatus.SCHEDULED_RETRY);
    expect(delivery.getRetryCount()).toBe(1);
    expect(delivery.getNextRetryAt()).not.toBeNull();
  });

  it('should transition to FAILED_DLQ on permanent failure or max retries exceeded', () => {
    const delivery = Delivery.create('res-123', 'dest-456');
    delivery.markAsProcessing();

    const permanentErr = new DeliveryError(DeliveryErrorCategory.PERMANENT, '404 Not Found');
    delivery.markAsFailed(permanentErr, RetryStrategyVO.exponential(1000, 30000), 5);

    expect(delivery.getStatus().getValue()).toBe(DeliveryStatus.FAILED_DLQ);
    expect(delivery.getStatus().isInDLQ()).toBe(true);
  });

  it('should track delivery attempts correctly', () => {
    const delivery = Delivery.create('res-123', 'dest-456');
    const attempt = RetryAttempt.create(1, 200, null, 120);
    delivery.addAttempt(attempt);

    expect(delivery.getAttempts().length).toBe(1);
    expect(delivery.getLastAttemptAt()).not.toBeNull();
  });
});
