import { v4 as uuidv4 } from 'uuid';

/**
 * Abstract base class for all Domain Events recording significant domain occurrences.
 */
export abstract class DomainEvent {
  public readonly id: string;
  public readonly aggregateId: string;
  public readonly aggregateType: string;
  public readonly occurredAt: Date;
  public readonly eventType: string;
  public readonly version: number;

  constructor(
    aggregateId: string,
    aggregateType: string,
    eventType: string,
    version = 1,
    id?: string,
    occurredAt?: Date
  ) {
    this.id = id || uuidv4();
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
    this.eventType = eventType;
    this.version = version;
    this.occurredAt = occurredAt ? new Date(occurredAt) : new Date();
  }

  public getId(): string {
    return this.id;
  }

  public getAggregateId(): string {
    return this.aggregateId;
  }

  public getAggregateType(): string {
    return this.aggregateType;
  }

  public getOccurredAt(): Date {
    return new Date(this.occurredAt);
  }

  public getEventType(): string {
    return this.eventType;
  }

  public getVersion(): number {
    return this.version;
  }

  /**
   * Serializes domain event to JSON object structure.
   */
  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      eventType: this.eventType,
      version: this.version,
      occurredAt: this.occurredAt.toISOString(),
    };
  }
}
