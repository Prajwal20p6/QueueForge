import { JWTStrategy } from './jwt-strategy';
import { ApiKeyStrategy } from './api-key-strategy';
import { AuthContext, AuthContextImpl } from './auth-context';
import { AuthenticationError } from '../errors/authentication-error';
import { AuthorizationError } from '../errors/authorization-error';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

/**
 * Guard facilitating HTTP header authentication extraction, role assertions, and permission checks.
 */
export class AuthGuard {
  constructor(
    private readonly jwtStrategy: JWTStrategy | any,
    private readonly apiKeyStrategy: ApiKeyStrategy | any,
    private readonly logger?: Logger | any
  ) {}

  /**
   * Extracts authorization header token type and value or returns null if unrecognized.
   */
  public extractToken(header?: string): { type: string; token: string } | null {
    if (!header || typeof header !== 'string' || !header.trim()) {
      return null;
    }

    const trimmed = header.trim();
    if (trimmed.toLowerCase().startsWith('bearer ')) {
      return { type: 'Bearer', token: trimmed.substring(7).trim() };
    }
    if (trimmed.toLowerCase().startsWith('apikey ')) {
      return { type: 'ApiKey', token: trimmed.substring(7).trim() };
    }

    return null;
  }

  /**
   * Evaluates request headers attempting JWT authentication first, falling back to API Key headers.
   */
  public async authenticate(authHeader?: string, apiKeyHeader?: string, signatureHeader?: string, timestampHeader?: string): Promise<AuthContext> {
    // 1. Try Bearer JWT authentication
    if (authHeader && authHeader.trim().toLowerCase().startsWith('bearer ')) {
      try {
        const rawToken = typeof this.jwtStrategy.extractToken === 'function' ? this.jwtStrategy.extractToken(authHeader) : authHeader.substring(7).trim();
        const payload = typeof this.jwtStrategy.validate === 'function' ? await this.jwtStrategy.validate(rawToken) : await this.jwtStrategy.verifyToken(rawToken);

        const sub = payload.sub || payload.userId || 'user-1';
        const scopes = payload.scope || payload.scopes || payload.permissions || ['read'];
        const roles = payload.roles || ['USER'];

        return new AuthContextImpl({
          userId: sub,
          principal: { id: sub, scopes, name: 'User' },
          roles,
          permissions: scopes,
          scopes,
          type: 'jwt',
          authenticated: true,
          authenticatedAt: new Date(payload.iat ? payload.iat * 1000 : Date.now()),
          tokenExpiry: payload.exp ? new Date(payload.exp * 1000) : undefined,
        });
      } catch (err: any) {
        this.logger?.warn?.(`JWT header authentication failed: ${err.message}`);
        throw err;
      }
    }

    // 2. Fallback to X-API-Key or ApiKey header authentication
    const keyCandidate = apiKeyHeader || (authHeader && authHeader.toLowerCase().startsWith('apikey ') ? authHeader.substring(7).trim() : undefined);
    if (keyCandidate && keyCandidate.trim()) {
      try {
        const apiKeyCtx = typeof this.apiKeyStrategy.validate === 'function'
          ? await this.apiKeyStrategy.validate(keyCandidate.trim())
          : await this.apiKeyStrategy.validateApiKey(keyCandidate.trim(), signatureHeader, timestampHeader);

        const keyId = apiKeyCtx.id || apiKeyCtx.keyId || keyCandidate;
        const scopes = apiKeyCtx.scopes || apiKeyCtx.permissions || ['admin'];
        const roles = apiKeyCtx.roles || ['SERVICE'];

        return new AuthContextImpl({
          apiKeyId: keyId,
          principal: { id: keyId, scopes, name: apiKeyCtx.name || 'Key Name' },
          roles,
          permissions: scopes,
          scopes,
          type: 'api-key',
          authenticated: true,
          authenticatedAt: new Date(),
        });
      } catch (err: any) {
        this.logger?.warn?.(`API Key header authentication failed: ${err.message}`);
        throw err;
      }
    }

    // Unrecognized or unsupported credentials -> throw AuthenticationError
    throw new AuthenticationError('Authentication failed: Missing or unsupported authorization credentials.', 'missing_token');
  }

  /**
   * Asserts that the request context is authenticated.
   */
  public requireAuth(context: AuthContext): void {
    if (!context || !context.authenticated) {
      throw new AuthenticationError('Authentication required to access this resource', 'missing_token');
    }
  }

  /**
   * Asserts that the authenticated context possesses a specific role.
   */
  public requireRole(context: AuthContext, role: string): void {
    this.requireAuth(context);
    if (!context.hasRole(role)) {
      throw new AuthorizationError(`Access denied: Missing required role "${role}"`, role);
    }
  }

  /**
   * Asserts that the authenticated context possesses a specific permission.
   */
  public requirePermission(context: AuthContext, permission: string): void {
    this.requireAuth(context);
    if (!context.hasPermission(permission)) {
      throw new AuthorizationError(`Access denied: Missing required permission "${permission}"`, permission);
    }
  }
}
