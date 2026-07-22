import { BaseError } from '../../shared/errors/base-error';
import { ErrorCode } from '../../shared/constants/error-codes';

/**
 * Abstract base class for all background daemon layer operational errors.
 */
export abstract class DaemonError extends BaseError {
  constructor(
    message: string,
    errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    statusCode: number = 500,
    details?: Record<string, any>
  ) {
    super(errorCode as any, statusCode as any, message, details);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class LeaderElectionError extends DaemonError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorCode.UNKNOWN_ERROR, 500, details);
  }
}

export class DaemonExecutionError extends DaemonError {
  constructor(daemonName: string, cause: Error | any) {
    super(
      `Daemon "${daemonName}" cycle execution failed: ${cause?.message || cause}`,
      ErrorCode.UNKNOWN_ERROR,
      500,
      { daemonName, causeMessage: cause?.message }
    );
  }
}

export class DependencyCheckError extends DaemonError {
  constructor(dependencyName: string, cause: Error | any) {
    super(
      `Dependency health check failed for "${dependencyName}": ${cause?.message || cause}`,
      ErrorCode.DB_CONNECTION_FAILED,
      503,
      { dependencyName }
    );
  }
}
