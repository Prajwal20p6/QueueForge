import { DomainError } from './domain-error';
import { ErrorCode } from '../../shared/constants/error-codes';

export class DestinationUnavailableError extends DomainError {
  constructor(destinationId: string, reason: string) {
    super(
      `Destination ${destinationId} is unavailable: ${reason}`,
      ErrorCode.CIRCUIT_OPEN,
      503,
      { destinationId, reason }
    );
  }
}
