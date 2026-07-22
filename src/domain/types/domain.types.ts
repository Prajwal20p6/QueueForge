import { AiTaskResult } from '../entities/ai-task-result.entity';
import { Delivery } from '../entities/delivery.entity';
import { Destination } from '../entities/destination.entity';
import { DeliveryError } from '../value-objects/delivery-error.vo';
import { DomainEvent } from '../events/domain-event';

/**
 * Composite container linking a Delivery entity with its target Destination entity.
 */
export interface DeliveryWithDestination {
  delivery: Delivery;
  destination: Destination;
}

/**
 * Traceability data structure for audit and lineage tracking.
 */
export interface LineageData {
  result: AiTaskResult;
  deliveries: DeliveryWithDestination[];
  timeline: DomainEvent[];
}

/**
 * Aggregate summary metrics across deliveries.
 */
export interface DeliveryStats {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  scheduled: number;
}

/**
 * Failure tracking metrics and categorizations.
 */
export interface FailureStats {
  attemptCount: number;
  errorCount: number;
  latestError: DeliveryError | null;
  categories: Record<string, number>;
}

export { RetryConfig } from '../value-objects/retry-strategy.vo';
