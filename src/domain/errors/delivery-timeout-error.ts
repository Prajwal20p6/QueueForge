import { DomainError } from './domain-error';
import { ErrorCode } from '../../shared/constants/error-codes';

export class DeliveryTimeoutError extends DomainError {
  constructor(deliveryId: string, timeoutMs: number) {
    super(
      `Delivery ${deliveryId} timed out after ${timeoutMs}ms`,
      ErrorCode.DELIVERY_TIMEOUT,
      408,
      { deliveryId, timeoutMs }
    );
  }
}
