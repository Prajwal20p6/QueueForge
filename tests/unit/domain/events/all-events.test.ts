import { DeliveryCreatedEvent } from '../../../../src/domain/events/delivery-created-event';
import { DeliveryCompletedEvent } from '../../../../src/domain/events/delivery-completed-event';
import { DeliveryFailedEvent } from '../../../../src/domain/events/delivery-failed-event';
import { DeliveryRetriedEvent } from '../../../../src/domain/events/delivery-retried-event';
import { DeliveryMovedToDLQEvent } from '../../../../src/domain/events/delivery-dlq-event';
import { DeliveryError, DeliveryErrorCategory } from '../../../../src/domain/value-objects/delivery-error.vo';

describe('Domain Events Suite Unit Tests', () => {
  it('should construct DeliveryCreatedEvent correctly', () => {
    const event = new DeliveryCreatedEvent('del-1', 'res-1', 'dest-1');
    expect(event.getEventType()).toBe('DELIVERY_CREATED');
    expect(event.toJSON().deliveryId).toBe('del-1');
  });

  it('should construct DeliveryCompletedEvent correctly', () => {
    const event = new DeliveryCompletedEvent('del-1', 'res-1', 'dest-1', 2, 450);
    expect(event.getEventType()).toBe('DELIVERY_COMPLETED');
    expect(event.toJSON().attempts).toBe(2);
    expect(event.toJSON().totalLatencyMs).toBe(450);
  });

  it('should construct DeliveryFailedEvent correctly', () => {
    const err = new DeliveryError(DeliveryErrorCategory.SERVER, '500 Internal Error', 500);
    const event = new DeliveryFailedEvent('del-1', 'res-1', 'dest-1', err);
    expect(event.getEventType()).toBe('DELIVERY_FAILED');
    expect(event.toJSON().statusCode).toBe(500);
  });

  it('should construct DeliveryRetriedEvent correctly', () => {
    const nextRetry = new Date(Date.now() + 5000);
    const event = new DeliveryRetriedEvent('del-1', 'res-1', 'dest-1', 1, nextRetry);
    expect(event.getEventType()).toBe('DELIVERY_RETRIED');
    expect(event.toJSON().retryCount).toBe(1);
  });

  it('should construct DeliveryMovedToDLQEvent correctly', () => {
    const event = new DeliveryMovedToDLQEvent('del-1', 'res-1', 'dest-1', 'Max retries reached');
    expect(event.getEventType()).toBe('DELIVERY_MOVED_TO_DLQ');
    expect(event.toJSON().reason).toBe('Max retries reached');
  });
});
