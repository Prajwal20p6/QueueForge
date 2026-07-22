import { ApplicationError } from './application-error';
import { ErrorCode } from '../../shared/constants/error-codes';
import { HttpStatus } from '../../shared/constants/http-status';

/**
 * Application Error thrown when attempting to ingest a result that already exists.
 * Used for idempotent re-ingestion checks.
 */
export class ResultAlreadyExistsError extends ApplicationError {
  constructor(public readonly resultId: string) {
    super(
      ErrorCode.RESULT_ALREADY_EXISTS,
      HttpStatus.CONFLICT,
      `AI Task Result with ID "${resultId}" already exists.`,
      { resultId }
    );
  }
}
