/**
 * Immutable constants defining business audit event names.
 */
export const AuditEvents = {
  // Entity mutations
  ENTITY_CREATED: 'ENTITY_CREATED',
  ENTITY_UPDATED: 'ENTITY_UPDATED',
  ENTITY_DELETED: 'ENTITY_DELETED',

  // Delivery task states
  DELIVERY_STARTED: 'DELIVERY_STARTED',
  DELIVERY_COMPLETED: 'DELIVERY_COMPLETED',
  DELIVERY_FAILED: 'DELIVERY_FAILED',
  DELIVERY_RETRIED: 'DELIVERY_RETRIED',
  DELIVERY_MOVED_TO_DLQ: 'DELIVERY_MOVED_TO_DLQ',

  // Session / Authentication checks
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  AUTH_TOKEN_ISSUED: 'AUTH_TOKEN_ISSUED',
  AUTH_TOKEN_REVOKED: 'AUTH_TOKEN_REVOKED',

  // Security violations
  RATE_LIMIT_VIOLATED: 'RATE_LIMIT_VIOLATED',
  HMAC_VERIFICATION_FAILED: 'HMAC_VERIFICATION_FAILED',
  CIRCUIT_BREAKER_OPENED: 'CIRCUIT_BREAKER_OPENED',

  // Scheduler / System processes
  WORKER_STARTED: 'WORKER_STARTED',
  WORKER_STOPPED: 'WORKER_STOPPED',
  WORKER_CRASHED: 'WORKER_CRASHED',
  RECOVERY_STARTED: 'RECOVERY_STARTED',
  RECOVERY_COMPLETED: 'RECOVERY_COMPLETED',
} as const;

export type AuditEventType = keyof typeof AuditEvents;

/**
 * Maps audit event types to human-readable explanations.
 */
export const AuditEventDescriptions: Record<string, string> = {
  [AuditEvents.ENTITY_CREATED]: 'A new database record has been created.',
  [AuditEvents.ENTITY_UPDATED]: 'An existing database record has been modified.',
  [AuditEvents.ENTITY_DELETED]: 'A database record has been deleted.',
  [AuditEvents.DELIVERY_STARTED]: 'Delivery processor started attempting a target dispatch.',
  [AuditEvents.DELIVERY_COMPLETED]: 'Delivery processor successfully dispatched result payload to destination.',
  [AuditEvents.DELIVERY_FAILED]: 'Delivery attempt failed with errors.',
  [AuditEvents.DELIVERY_RETRIED]: 'Delivery failed and has been scheduled for retries.',
  [AuditEvents.DELIVERY_MOVED_TO_DLQ]: 'All retry attempts exhausted, task result has been moved to DLQ.',
  [AuditEvents.AUTH_SUCCESS]: 'A client authenticated successfully.',
  [AuditEvents.AUTH_FAILURE]: 'Client authentication attempt failed due to invalid credentials.',
  [AuditEvents.AUTH_TOKEN_ISSUED]: 'A new JWT token was issued.',
  [AuditEvents.AUTH_TOKEN_REVOKED]: 'An access token was explicitly blacklisted.',
  [AuditEvents.RATE_LIMIT_VIOLATED]: 'A client exceeded their configured rate limit threshold.',
  [AuditEvents.HMAC_VERIFICATION_FAILED]: 'Incoming payload failed signature checks.',
  [AuditEvents.CIRCUIT_BREAKER_OPENED]: 'Circuit breaker opened for a target destination.',
  [AuditEvents.WORKER_STARTED]: 'Background consumer worker started.',
  [AuditEvents.WORKER_STOPPED]: 'Background consumer worker stopped.',
  [AuditEvents.WORKER_CRASHED]: 'Background consumer worker crashed.',
  [AuditEvents.RECOVERY_STARTED]: 'Cron job began sweeping for stale pending deliveries.',
  [AuditEvents.RECOVERY_COMPLETED]: 'Cron job successfully finished sweeping stale pending deliveries.',
};
