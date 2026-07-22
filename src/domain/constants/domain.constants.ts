/**
 * Domain-wide core business rules constants.
 */
export const MAX_DELIVERY_RETRIES = 5;
export const MIN_RETRY_DELAY_MS = 1000;
export const MAX_RETRY_DELAY_MS = 3600000; // 1 hour
export const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds
export const BACKOFF_MULTIPLIER = 2;
export const JITTER_FACTOR = 0.1;
export const CIRCUIT_BREAKER_DEFAULT_THRESHOLD = 5;
export const CIRCUIT_BREAKER_DEFAULT_TIMEOUT_MS = 60000; // 1 minute
