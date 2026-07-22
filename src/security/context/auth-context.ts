export interface IAuthContext {
  readonly type: 'jwt' | 'api-key';
  readonly principal: {
    id: string;
    name?: string;
    scopes?: string[];
  };
  readonly timestamp: Date;
  readonly correlationId: string;
}

/**
 * Context container storing request authentication scopes, identifiers, and correlation tags.
 */
export class AuthContext implements IAuthContext {
  readonly type: 'jwt' | 'api-key';
  readonly principal: {
    id: string;
    name?: string;
    scopes?: string[];
  };
  readonly timestamp: Date;
  readonly correlationId: string;

  constructor(
    type: 'jwt' | 'api-key',
    principal: { id: string; name?: string; scopes?: string[] },
    correlationId: string
  ) {
    this.type = type;
    this.principal = principal;
    this.correlationId = correlationId;
    this.timestamp = new Date();
  }

  /**
   * Retrieves the principal identity string
   */
  public getPrincipalId(): string {
    return this.principal.id;
  }

  /**
   * Checks if principal is authorized under specific scope string
   */
  public hasScope(scope: string): boolean {
    if (!this.principal.scopes) return false;
    return this.principal.scopes.includes(scope);
  }

  /**
   * Checks if principal scope list contains 'admin' privilege
   */
  public isAdmin(): boolean {
    return this.hasScope('admin');
  }

  /**
   * Serializes structure removing any sensitive credentials
   */
  public toJSON(): object {
    return {
      type: this.type,
      principalId: this.getPrincipalId(),
      principalName: this.principal.name,
      correlationId: this.correlationId,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

/**
 * Factory creating new AuthContext instances
 */
export function createAuthContext(
  type: 'jwt' | 'api-key',
  principal: { id: string; name?: string; scopes?: string[] },
  correlationId: string
): AuthContext {
  return new AuthContext(type, principal, correlationId);
}
