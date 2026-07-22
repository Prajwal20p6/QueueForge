/**
 * HTTP response status codes mapped for controllers and error classes
 */
export const enum HttpStatus {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  VALIDATION_ERROR = 422,
  RATE_LIMITED = 429,
  SERVER_ERROR = 500,
}
