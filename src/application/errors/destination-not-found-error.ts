import { ApplicationError } from './application-error';
import { ErrorCode } from '../../shared/constants/error-codes';
import { HttpStatus } from '../../shared/constants/http-status';

/**
 * Application Error thrown when a target destination is not found.
 */
export class DestinationNotFoundError extends ApplicationError {
  constructor(public readonly destinationId: string) {
    super(
      ErrorCode.NOT_FOUND,
      HttpStatus.NOT_FOUND,
      `Destination with identifier "${destinationId}" was not found.`,
      { destinationId }
    );
  }
}
