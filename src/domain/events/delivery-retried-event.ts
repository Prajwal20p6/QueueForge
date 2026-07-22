import { DomainEvent } from './domain-event';

/**
 * Domain Event emitted when a delivery task is scheduled for retry.
 */
export class DeliveryRetriedEvent extends DomainEvent {
  public readonly deliveryId: string;
  public readonly resultId: string;
  public readonly destinationId: string;
  public readonly retryCount: number;
  public readonly nextRetryAt: Date;

  constructor(
    deliveryId: string,
    resultId: string,
    destinationId: string,
    retryCount: number,
    nextRetryAt: Date
  ) {
    super(deliveryId, 'Delivery', 'DELIVERY_RETRIED', 1);
    this.deliveryId = deliveryId;
    this.resultId = resultId;
    this.destinationId = destinationId;
    this.retryCount = retryCount;
    this.nextRetryAt = new Date(nextRetryAt);
  }

  public override toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      deliveryId: this.deliveryId,
      resultId: this.resultId,
      destinationId: this.destinationId,
      retryCount: this.retryCount,
      nextRetryAt: this.nextRetryAt.toISOString(),
    };
  }
}

export { DeliveryRetriedEvent as DeliveryRetried };
