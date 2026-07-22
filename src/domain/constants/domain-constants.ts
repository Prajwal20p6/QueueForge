/**
 * Error codes representing specific domain logic failures in QueueForge.
 */
export enum ErrorCode {
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  DELIVERY_TIMEOUT = 'DELIVERY_TIMEOUT',
  CIRCUIT_OPEN = 'CIRCUIT_OPEN',
  RATE_LIMITED = 'RATE_LIMITED',
  MAX_RETRIES_EXCEEDED = 'MAX_RETRIES_EXCEEDED',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
  DUPLICATE_DELIVERY = 'DUPLICATE_DELIVERY',
}

/**
 * HTTP Status code mappings for retryable or permanent decisions.
 */
export enum HttpStatusDecision {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  REQUEST_TIMEOUT = 408,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
}

// Domain boundary constants
export const MAX_CONFIDENCE = 1;
export const MIN_CONFIDENCE = 0;
export const DEFAULT_CONFIDENCE_HIGH_THRESHOLD = 0.75;
export const DEFAULT_CONFIDENCE_LOW_THRESHOLD = 0.25;
export const MAX_EMAIL_LENGTH = 255;
export const MAX_AGENT_ID_LENGTH = 255;

// Default retry strategy constants
export const DEFAULT_MAX_RETRIES = 5;
export const DEFAULT_BACKOFF_BASE_MS = 1000;
export const DEFAULT_BACKOFF_MAX_MS = 3600000;
export const DEFAULT_JITTER_FACTOR = 1;
