import { DomainEvent } from './domain-event';

/**
 * Domain Event emitted when a delivery task is created.
 */
export class DeliveryCreatedEvent extends DomainEvent {
  public readonly deliveryId: string;
  public readonly resultId: string;
  public readonly destinationId: string;

  constructor(deliveryId: string, resultId: string, destinationId: string) {
    super(deliveryId, 'Delivery', 'DELIVERY_CREATED', 1);
    this.deliveryId = deliveryId;
    this.resultId = resultId;
    this.destinationId = destinationId;
  }

  public override toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      deliveryId: this.deliveryId,
      resultId: this.resultId,
      destinationId: this.destinationId,
    };
  }
}
