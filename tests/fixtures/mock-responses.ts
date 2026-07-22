/**
 * Typed webhook response shapes for use in HTTP mock setups.
 */

/** Shape of a mocked webhook HTTP response. */
export interface WebhookResponse {
  statusCode: number;
  body: Record<string, unknown>;
  headers?: Record<string, string>;
  delayMs?: number;
}

/**
 * Creates a successful webhook response.
 * @param status - HTTP status code (default: 200).
 * @returns WebhookResponse with standard success body.
 */
export function createSuccessResponse(status = 200): WebhookResponse {
  return {
    statusCode: status,
    body: {
      status: 'ok',
      received: true,
      timestamp: new Date().toISOString(),
    },
    headers: {
      'Content-Type': 'application/json',
      'X-Delivery-Id': `delivery-${Date.now()}`,
    },
  };
}

/**
 * Creates a webhook error response with the given status code and error description.
 * @param statusCode - HTTP error status code (e.g., 400, 500).
 * @param error - Error message string.
 * @returns WebhookResponse with error body.
 */
export function createErrorResponse(statusCode: number, error: string): WebhookResponse {
  return {
    statusCode,
    body: {
      status: 'error',
      error,
      code: statusCode,
      timestamp: new Date().toISOString(),
    },
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Creates a response configuration that simulates a delayed/timeout scenario.
 * @param delayMs - Number of milliseconds to delay the response.
 * @returns WebhookResponse with delay configuration.
 */
export function createTimeoutResponse(delayMs: number): WebhookResponse {
  return {
    statusCode: 504,
    body: {
      status: 'error',
      error: 'Gateway Timeout',
      code: 504,
    },
    delayMs,
  };
}

/** Pre-built response: HTTP 200 OK */
export const RESPONSE_OK = createSuccessResponse(200);

/** Pre-built response: HTTP 201 Created */
export const RESPONSE_CREATED = createSuccessResponse(201);

/** Pre-built response: HTTP 400 Bad Request */
export const RESPONSE_BAD_REQUEST = createErrorResponse(400, 'Bad Request — Invalid payload format');

/** Pre-built response: HTTP 401 Unauthorized */
export const RESPONSE_UNAUTHORIZED = createErrorResponse(401, 'Unauthorized — Missing or invalid HMAC signature');

/** Pre-built response: HTTP 429 Rate Limited */
export const RESPONSE_RATE_LIMITED = createErrorResponse(429, 'Too Many Requests — Rate limit exceeded');

/** Pre-built response: HTTP 500 Internal Server Error */
export const RESPONSE_SERVER_ERROR = createErrorResponse(500, 'Internal Server Error — Downstream service unavailable');

/** Pre-built response: HTTP 503 Service Unavailable */
export const RESPONSE_UNAVAILABLE = createErrorResponse(503, 'Service Unavailable — Destination temporarily offline');

/** Pre-built response: 30s timeout */
export const RESPONSE_TIMEOUT_30S = createTimeoutResponse(30000);
