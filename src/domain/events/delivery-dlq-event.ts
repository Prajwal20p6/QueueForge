import { DomainEvent } from './domain-event';

/**
 * Domain Event emitted when a delivery exhausts retries or suffers unrecoverable errors and is routed to Dead Letter Queue (DLQ).
 */
export class DeliveryMovedToDLQEvent extends DomainEvent {
  public readonly deliveryId: string;
  public readonly resultId: string;
  public readonly destinationId: string;
  public readonly reason: string;

  constructor(deliveryId: string, resultId: string, destinationId: string, reason: string) {
    super(deliveryId, 'Delivery', 'DELIVERY_MOVED_TO_DLQ', 1);
    this.deliveryId = deliveryId;
    this.resultId = resultId;
    this.destinationId = destinationId;
    this.reason = reason;
  }

  public override toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      deliveryId: this.deliveryId,
      resultId: this.resultId,
      destinationId: this.destinationId,
      reason: this.reason,
    };
  }
}
