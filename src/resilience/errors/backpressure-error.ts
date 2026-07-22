import { ResilienceError } from './resilience-error';
import { ErrorCode } from '../../shared/constants/error-codes';

/**
 * Error thrown when the pipeline refuses new tasks due to high queue backpressure levels.
 */
export class BackpressureError extends ResilienceError {
  constructor(public readonly reason: string, public readonly pressureLevel: string) {
    super(
      ErrorCode.RATE_LIMITED,
      503,
      `System under backpressure: ${reason} (${pressureLevel})`,
      { reason, pressureLevel }
    );
    this.name = 'BackpressureError';
    Object.setPrototypeOf(this, BackpressureError.prototype);
  }
}
