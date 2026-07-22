import { ResilienceError } from './resilience-error';
import { ErrorCode } from '../../shared/constants/error-codes';

/**
 * Error thrown when an operation execution window times out.
 */
export class TimeoutError extends ResilienceError {
  constructor(public readonly operationName: string, public readonly timeoutMs: number) {
    super(
      ErrorCode.DELIVERY_TIMEOUT,
      408,
      `Operation ${operationName} timed out after ${timeoutMs}ms`,
      { operationName, timeoutMs }
    );
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}
