export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

export const HTTP_HEADERS = {
  AUTHORIZATION: 'Authorization',
  CONTENT_TYPE: 'Content-Type',
  CORRELATION_ID: 'X-Correlation-ID',
  RATE_LIMIT_LIMIT: 'X-RateLimit-Limit',
  RATE_LIMIT_REMAINING: 'X-RateLimit-Remaining',
  RATE_LIMIT_RESET: 'X-RateLimit-Reset',
};

export const CONTENT_TYPES = {
  JSON: 'application/json',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  TEXT_HTML: 'text/html',
};
export { HTTP_STATUS as status };
export { HTTP_HEADERS as headers };
export { CONTENT_TYPES as types };
