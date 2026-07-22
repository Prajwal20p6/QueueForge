import { BaseError } from '../../shared/errors/base-error';
import { ErrorCode } from '../../shared/constants/error-codes';
import { HttpStatus } from '../../shared/constants/http-status';

export interface ErrorResponseEnvelope {
  error: string;
  code: string;
  message: string;
  statusCode: number;
  timestamp: string;
  traceId?: string;
  details?: any;
}

/**
 * Class transforming system exceptions and domain errors into sanitized HTTP error JSON structures.
 */
export class ErrorSerializer {
  /**
   * Maps an Error instance into a standardized ErrorResponseEnvelope.
   */
  public static serialize(err: any, traceId?: string): { statusCode: number; payload: ErrorResponseEnvelope } {
    let statusCode: number = HttpStatus.SERVER_ERROR;
    let code = ErrorCode.UNKNOWN_ERROR;
    let message = 'An unexpected internal server error occurred.';
    let details: any = undefined;

    if (err instanceof BaseError) {
      statusCode = err.statusCode || HttpStatus.SERVER_ERROR;
      code = err.code || ErrorCode.UNKNOWN_ERROR;
      message = err.message;
      details = (err as any).details;
    } else if (err && typeof err === 'object') {
      if (err.name === 'ValidationError' || err.code === 'VALIDATION_FAILED' || err.statusCode === 422) {
        statusCode = HttpStatus.VALIDATION_ERROR;
        code = ErrorCode.VALIDATION_FAILED;
        message = err.message || 'Validation failed for request parameters.';
        details = err.details || err.errors;
      } else if (err.name === 'NotFoundError' || err.statusCode === 404) {
        statusCode = HttpStatus.NOT_FOUND;
        code = ErrorCode.NOT_FOUND;
        message = err.message || 'Requested resource was not found.';
      } else if (err.name === 'ConflictError' || err.statusCode === 409) {
        statusCode = HttpStatus.CONFLICT;
        code = ErrorCode.RESULT_ALREADY_EXISTS;
        message = err.message || 'Resource conflict occurred.';
      } else if (err.name === 'AuthenticationError' || err.statusCode === 401) {
        statusCode = HttpStatus.UNAUTHORIZED;
        code = ErrorCode.UNAUTHENTICATED;
        message = err.message || 'Authentication required.';
      } else if (err.name === 'AuthorizationError' || err.statusCode === 403) {
        statusCode = HttpStatus.FORBIDDEN;
        code = ErrorCode.UNAUTHORIZED;
        message = err.message || 'Access denied.';
      } else if (err.name === 'RateLimitError' || err.statusCode === 429) {
        statusCode = HttpStatus.RATE_LIMITED;
        code = ErrorCode.RATE_LIMITED;
        message = err.message || 'Rate limit exceeded.';
        details = { retryAfterSeconds: err.retryAfterSeconds };
      } else {
        statusCode = err.statusCode || err.status || HttpStatus.SERVER_ERROR;
        message = err.message || message;
      }
    }

    const payload: ErrorResponseEnvelope = {
      error: ErrorSerializer.getErrorName(statusCode),
      code,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      ...(traceId ? { traceId } : {}),
      ...(details ? { details } : {}),
    };

    return { statusCode, payload };
  }

  private static getErrorName(statusCode: number): string {
    switch (statusCode) {
      case 400: return 'Bad Request';
      case 401: return 'Unauthorized';
      case 403: return 'Forbidden';
      case 404: return 'Not Found';
      case 409: return 'Conflict';
      case 413: return 'Payload Too Large';
      case 422: return 'Unprocessable Entity';
      case 429: return 'Too Many Requests';
      case 503: return 'Service Unavailable';
      default: return 'Internal Server Error';
    }
  }
}
