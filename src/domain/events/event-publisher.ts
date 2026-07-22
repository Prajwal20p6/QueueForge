import { DomainEvent } from './domain-event';

/**
 * Interface contract for publishing Domain Events asynchronously.
 * Implementations are provided by application or messaging layers.
 */
export interface EventPublisher {
  /**
   * Publishes a single Domain Event.
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publishes a batch of Domain Events atomically or in sequence.
   */
  publishMany(events: DomainEvent[]): Promise<void>;
}
