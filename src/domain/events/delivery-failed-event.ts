import { DomainEvent } from './domain-event';
import { DeliveryError } from '../value-objects/delivery-error.vo';

/**
 * Domain Event emitted when a delivery attempt fails.
 */
export class DeliveryFailedEvent extends DomainEvent {
  public readonly deliveryId: string;
  public readonly resultId: string;
  public readonly destinationId: string;
  public readonly error: DeliveryError;
  public readonly statusCode?: number;

  constructor(
    deliveryId: string,
    resultId: string,
    destinationId: string,
    error: DeliveryError,
    statusCode?: number
  ) {
    super(deliveryId, 'Delivery', 'DELIVERY_FAILED', 1);
    this.deliveryId = deliveryId;
    this.resultId = resultId;
    this.destinationId = destinationId;
    this.error = error;
    this.statusCode = statusCode ?? error.getStatusCode() ?? undefined;
  }

  public override toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      deliveryId: this.deliveryId,
      resultId: this.resultId,
      destinationId: this.destinationId,
      error: this.error.toString(),
      statusCode: this.statusCode,
    };
  }
}
