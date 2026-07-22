import { SecurityError } from './security-error';

/**
 * Exception thrown when an authenticated user lacks required roles or permissions for a resource.
 */
export class AuthorizationError extends SecurityError {
  public readonly resource?: string;

  constructor(message: string = 'Access denied: Insufficient permissions', resource?: string) {
    super(message, 403, { resource });
    this.name = 'AuthorizationError';
    this.resource = resource;
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}
