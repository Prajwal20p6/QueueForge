/**
 * Domain-level statuses of task dispatches
 */
export enum DeliveryStatusEnum {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

/**
 * Domain-level target destination types
 */
export enum DestinationTypeEnum {
  WEBHOOK = 'WEBHOOK',
  DATABASE = 'DATABASE',
  QUEUE = 'QUEUE',
}

/**
 * Domain categories classifying base errors
 */
export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  INTERNAL = 'INTERNAL',
}

/**
 * Domain backoff strategies types
 */
export type BackoffType = 'EXPONENTIAL' | 'LINEAR' | 'FIXED';
