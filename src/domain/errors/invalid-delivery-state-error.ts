import { DomainError } from './domain-error';
import { ErrorCode } from '../../shared/constants/error-codes';
import { DeliveryStatus } from '../value-objects/delivery-status.vo';

export class InvalidDeliveryStateError extends DomainError {
  constructor(currentStatus: DeliveryStatus | string | any, attemptedTransition: DeliveryStatus | string | any) {
    const cur = typeof currentStatus === 'object' && currentStatus !== null ? ((currentStatus as any).kind || (currentStatus as any).value || String(currentStatus)) : String(currentStatus);
    const att = typeof attemptedTransition === 'object' && attemptedTransition !== null ? ((attemptedTransition as any).kind || (attemptedTransition as any).value || String(attemptedTransition)) : String(attemptedTransition);
    const curUpper = String(cur).toUpperCase();
    const attUpper = String(att).toUpperCase();

    super(
      `Delivery in status "${curUpper}" cannot transition to "${attUpper}".`,
      ErrorCode.DELIVERY_FAILED,
      400,
      { currentStatus, attemptedTransition }
    );
  }
}
