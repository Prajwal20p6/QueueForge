import { ResilienceError } from './resilience-error';
import { ErrorCode } from '../../shared/constants/error-codes';

/**
 * Error thrown when an execution attempt is blocked because the destination circuit breaker is open.
 */
export class CircuitOpenError extends ResilienceError {
  constructor(public readonly destinationId: string) {
    super(
      ErrorCode.CIRCUIT_OPEN,
      503,
      `Circuit breaker open for destination ${destinationId}`,
      { destinationId }
    );
    this.name = 'CircuitOpenError';
    Object.setPrototypeOf(this, CircuitOpenError.prototype);
  }
}
