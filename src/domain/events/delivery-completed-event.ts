import { DomainEvent } from './domain-event';

/**
 * Domain Event emitted when a delivery completes successfully.
 */
export class DeliveryCompletedEvent extends DomainEvent {
  public readonly deliveryId: string;
  public readonly resultId: string;
  public readonly destinationId: string;
  public readonly attempts: number;
  public readonly totalLatencyMs: number;

  constructor(
    deliveryId: string,
    resultId: string,
    destinationId: string,
    attempts: number,
    totalLatencyMs: number
  ) {
    super(deliveryId, 'Delivery', 'DELIVERY_COMPLETED', 1);
    this.deliveryId = deliveryId;
    this.resultId = resultId;
    this.destinationId = destinationId;
    this.attempts = attempts;
    this.totalLatencyMs = totalLatencyMs;
  }

  public override toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      deliveryId: this.deliveryId,
      resultId: this.resultId,
      destinationId: this.destinationId,
      attempts: this.attempts,
      totalLatencyMs: this.totalLatencyMs,
    };
  }
}
