import { ResilienceError } from './resilience-error';
import { ErrorCode } from '../../shared/constants/error-codes';

/**
 * Error thrown when a bulkhead resource pool capacity and queue are fully exhausted.
 */
export class BulkheadFullError extends ResilienceError {
  constructor(public readonly name: string) {
    super(
      ErrorCode.RATE_LIMITED,
      503,
      `Bulkhead ${name} at capacity`,
      { name }
    );
    this.name = 'BulkheadFullError';
    Object.setPrototypeOf(this, BulkheadFullError.prototype);
  }
}
