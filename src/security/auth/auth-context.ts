export interface AuthContextData {
  userId?: string;
  apiKeyId?: string;
  principal?: string | { id: string; scopes: string[]; name: string };
  subject?: string;
  roles?: string[];
  permissions?: string[];
  scopes?: string[];
  type?: 'jwt' | 'api_key' | 'api-key' | 'anonymous';
  authenticated?: boolean;
  authenticatedAt?: Date;
  tokenExpiry?: Date;
  metadata?: Record<string, any>;
}

export interface AuthContext extends AuthContextData {
  userId?: string;
  apiKeyId?: string;
  authenticated: boolean;
  roles: string[];
  permissions: string[];
  principal?: string | { id: string; scopes: string[]; name: string } | any;
  subject?: string;
  scopes?: string[];
  type?: 'jwt' | 'api_key' | 'api-key' | 'anonymous' | any;
  hasRole(role: string): boolean;
  hasPermission(permission: string): boolean;
  hasAnyRole(roles: string[]): boolean;
  hasAllRoles(roles: string[]): boolean;
  getIdentifier(): string;
  getPrincipalId(): string;
}

/**
 * Value Object encapsulating security claims, roles, and permissions of an authenticated requester context.
 */
export class AuthContextImpl implements AuthContext {
  public readonly userId?: string;
  public readonly apiKeyId?: string;
  public readonly principal?: string | { id: string; scopes: string[]; name: string } | any;
  public readonly subject?: string;
  public readonly roles: string[];
  public readonly permissions: string[];
  public readonly scopes?: string[];
  public readonly type?: 'jwt' | 'api_key' | 'api-key' | 'anonymous' | any;
  public readonly authenticated: boolean;
  public readonly authenticatedAt: Date;
  public readonly tokenExpiry?: Date;
  public readonly metadata?: Record<string, any>;

  constructor(data: AuthContextData) {
    this.userId = data.userId;
    this.apiKeyId = data.apiKeyId;
    this.principal = data.principal || data.userId || data.apiKeyId || 'anonymous';
    this.subject = data.subject || data.userId || data.apiKeyId || 'anonymous';
    this.roles = (data.roles || []).map(r => r.toUpperCase());
    this.permissions = (data.permissions || []).map(p => p.toUpperCase());
    this.scopes = data.scopes || this.permissions;
    this.type = data.type || (data.userId ? 'jwt' : (data.apiKeyId ? 'api_key' : 'anonymous'));
    this.authenticated = data.authenticated ?? false;
    this.authenticatedAt = data.authenticatedAt || new Date();
    this.tokenExpiry = data.tokenExpiry;
    this.metadata = data.metadata;
  }

  /**
   * Asserts whether the authenticated context possesses a specific role.
   */
  public hasRole(role: string): boolean {
    if (!this.authenticated || !role) return false;
    const target = role.toUpperCase();
    return this.roles.includes(target) || this.roles.includes('ADMIN');
  }

  /**
   * Asserts whether the authenticated context possesses a specific permission.
   */
  public hasPermission(permission: string): boolean {
    if (!this.authenticated || !permission) return false;
    const target = permission.toUpperCase();
    return this.permissions.includes(target) || this.permissions.includes('*') || this.roles.includes('ADMIN');
  }

  /**
   * Asserts whether the context possesses at least one role from the provided list.
   */
  public hasAnyRole(roles: string[]): boolean {
    if (!this.authenticated || !roles || roles.length === 0) return false;
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Asserts whether the context possesses all roles from the provided list.
   */
  public hasAllRoles(roles: string[]): boolean {
    if (!this.authenticated || !roles) return false;
    return roles.every(role => this.hasRole(role));
  }

  /**
   * Returns the primary identifying subject string (user ID or API key ID).
   */
  public getIdentifier(): string {
    return this.getPrincipalId();
  }

  /**
   * Returns string ID of principal context.
   */
  public getPrincipalId(): string {
    if (typeof this.principal === 'object' && this.principal !== null) {
      return this.principal.id;
    }
    return String(this.principal || this.userId || this.apiKeyId || 'anonymous');
  }

  /**
   * Creates an unauthenticated guest context instance.
   */
  public static unauthenticated(): AuthContextImpl {
    return new AuthContextImpl({
      roles: [],
      permissions: [],
      scopes: [],
      type: 'anonymous',
      authenticated: false,
      authenticatedAt: new Date(),
    });
  }
}

export function createAuthContext(type: any, principal: any, _correlationId?: string): AuthContext {
  return new AuthContextImpl({
    type,
    principal,
    userId: typeof principal === 'string' ? principal : principal?.id,
    roles: typeof principal === 'object' ? principal?.roles || ['SERVICE'] : ['USER'],
    permissions: typeof principal === 'object' ? principal?.permissions || ['READ', 'WRITE'] : ['READ'],
    authenticated: true,
    authenticatedAt: new Date(),
  });
}
