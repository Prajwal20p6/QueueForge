import { DomainError } from './domain-error';
import { ErrorCode } from '../../shared/constants/error-codes';

export class IdempotencyConflictError extends DomainError {
  constructor(taskResultId: string, destinationId: string, existingDeliveryId?: string) {
    super(
      `Idempotency conflict: duplicate request for result ${taskResultId} to destination ${destinationId}${existingDeliveryId ? ` (Existing delivery: ${existingDeliveryId})` : ''}`,
      ErrorCode.DELIVERY_FAILED,
      409,
      { taskResultId, destinationId, existingDeliveryId }
    );
  }
}
