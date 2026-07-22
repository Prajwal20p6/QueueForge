export interface AiResultReceivedEvent {
  readonly name: 'AiResultReceivedEvent';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly resultId: string;
  readonly emailId: string;
  readonly agentId: string;
  readonly confidenceScore: number;
}

export interface DeliveryScheduledEvent {
  readonly name: 'DeliveryScheduledEvent';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly deliveryId: string;
  readonly destinationId: string;
  readonly scheduledFor: Date;
}

export interface DeliveryCompletedEvent {
  readonly name: 'DeliveryCompletedEvent';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly deliveryId: string;
  readonly responseStatus: number;
  readonly latencyMs: number;
}

export interface DeliveryFailedEvent {
  readonly name: 'DeliveryFailedEvent';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly deliveryId: string;
  readonly errorMessage: string;
  readonly isRetryable: boolean;
  readonly retryCount: number;
}

export interface DeliveryMovedToDLQEvent {
  readonly name: 'DeliveryMovedToDLQEvent';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly deliveryId: string;
  readonly finalErrorMessage: string;
  readonly totalAttempts: number;
}

export interface WorkerCrashedEvent {
  readonly name: 'WorkerCrashedEvent';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly workerId: string;
  readonly crashReason: string;
}

export interface CircuitBreakerOpenedEvent {
  readonly name: 'CircuitBreakerOpenedEvent';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly destinationId: string;
  readonly failureRate: number;
  readonly threshold: number;
}

export interface CircuitBreakerClosedEvent {
  readonly name: 'CircuitBreakerClosedEvent';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly destinationId: string;
  readonly recoveredAt: Date;
}

export type DomainEvent =
  | AiResultReceivedEvent
  | DeliveryScheduledEvent
  | DeliveryCompletedEvent
  | DeliveryFailedEvent
  | DeliveryMovedToDLQEvent
  | WorkerCrashedEvent
  | CircuitBreakerOpenedEvent
  | CircuitBreakerClosedEvent;
