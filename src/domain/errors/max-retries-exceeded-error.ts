import { DomainError } from './domain-error';
import { ErrorCode } from '../../shared/constants/error-codes';

/**
 * Thrown when a delivery execution attempt exceeds the maximum configured retry count limit.
 */
export class MaxRetriesExceededError extends DomainError {
  constructor(deliveryId: string, maxRetries: number, attemptedRetry: number) {
    super(
      `Delivery ${deliveryId} exceeded max retries (${maxRetries}). Attempted retry: ${attemptedRetry}.`,
      ErrorCode.MAX_RETRIES_EXCEEDED,
      400,
      { deliveryId, maxRetries, attemptedRetry }
    );
  }
}
