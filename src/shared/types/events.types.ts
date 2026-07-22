import { UUID, ISO8601DateTime } from './common.types';

/**
 * Base interface representing domain events emitted by aggregates lifecycle
 */
export interface DomainEvent {
  readonly id: UUID;
  readonly aggregateId: string;
  readonly occurredAt: ISO8601DateTime;
  readonly eventType: string;
  readonly version: number;
  readonly data: Record<string, any>;
}
export { DomainEvent as BaseDomainEvent };
