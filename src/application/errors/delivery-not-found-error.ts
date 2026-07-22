import { ApplicationError } from './application-error';
import { ErrorCode } from '../../shared/constants/error-codes';
import { HttpStatus } from '../../shared/constants/http-status';

/**
 * Application Error thrown when a delivery record is not found.
 */
export class DeliveryNotFoundError extends ApplicationError {
  constructor(public readonly deliveryId: string) {
    super(
      ErrorCode.NOT_FOUND,
      HttpStatus.NOT_FOUND,
      `Delivery with identifier "${deliveryId}" was not found.`,
      { deliveryId }
    );
  }
}
