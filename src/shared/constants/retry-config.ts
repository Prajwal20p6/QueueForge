/**
 * Classifies HTTP status codes to guide retry rules for webhook delivery
 */
export const TRANSIENT_STATUS_CODES = [408, 429, 500, 502, 503, 504];
export const PERMANENT_STATUS_CODES = [400, 401, 403, 404, 422];
