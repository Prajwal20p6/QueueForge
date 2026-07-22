import { AuthenticationError as SharedAuthenticationError } from '../../shared/errors/authentication-error';

export type AuthenticationReason =
  | 'missing_token'
  | 'invalid_token'
  | 'expired_token'
  | 'invalid_credentials'
  | 'invalid_key'
  | 'revoked_token';

/**
 * Exception thrown when authentication fails due to invalid credentials, missing or expired tokens.
 */
export class AuthenticationError extends SharedAuthenticationError {
  public readonly reason: AuthenticationReason;

  constructor(message: string = 'Authentication failed', reason: AuthenticationReason = 'invalid_credentials') {
    super(message, { reason });
    this.name = 'AuthenticationError';
    this.reason = reason;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
