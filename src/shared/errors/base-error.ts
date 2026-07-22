import { ErrorCode } from '../constants/error-codes';
import { HttpStatus } from '../constants/http-status';

/**
 * Base abstract error class for all domain, application, and infrastructure errors in QueueForge
 */
export abstract class BaseError extends Error {
  public readonly timestamp: string;
  public readonly traceId?: string;

  /**
   * Creates an instance of BaseError.
   * @param code - The application-specific error code.
   * @param statusCode - The HTTP status code suitable for this error.
   * @param message - Descriptive error message.
   * @param context - Additional debugging context.
   * @param traceId - Correlation trace identifier.
   */
  constructor(
    public readonly code: ErrorCode,
    public readonly statusCode: HttpStatus,
    message: string,
    public readonly context?: Record<string, any>,
    traceId?: string
  ) {
    super(message);
    this.timestamp = new Date().toISOString();
    this.traceId = traceId;

    // Restore prototype chain for correct inheritance checks
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture clean stack traces if not in production environment
    if (process.env.NODE_ENV !== 'production') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = undefined;
    }
  }

  /**
   * Serializes error details to JSON format
   */
  public toJSON(): Record<string, any> {
    return {
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      traceId: this.traceId,
      context: process.env.NODE_ENV === 'production' ? undefined : this.context,
    };
  }

  /**
   * Returns standardized API error response payload
   */
  public toResponse(): Record<string, any> {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
      },
      timestamp: this.timestamp,
    };
  }
}
