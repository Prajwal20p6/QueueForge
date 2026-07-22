import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../errors/authentication-error';
import { SecurityConfig } from '../../config/security.config';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

export interface JWTPayload extends Record<string, any> {
  sub: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  roles?: string[];
  permissions?: string[];
}

/**
 * Strategy managing JSON Web Token (JWT) issuance, verification, parsing, and lifecycle.
 */
export class JWTStrategy {
  private readonly secret: string;
  private readonly issuer: string;
  private readonly audience: string;
  private readonly defaultExpiryMs: number;

  constructor(
    config?: SecurityConfig | any,
    private readonly logger?: Logger | any
  ) {
    this.secret = config?.jwtSecret || config?.jwt?.secret || process.env.JWT_SECRET || 'queueforge-secret-key-min-32-chars-long!';
    this.issuer = config?.jwtIssuer || config?.jwt?.issuer || 'queueforge';
    this.audience = config?.jwtAudience || config?.jwt?.audience || 'queueforge-api';
    this.defaultExpiryMs = config?.jwtExpiresInMs || config?.jwt?.expiresInMs || 3600000; // 1 hour default
  }

  /**
   * Generates a signed HS256 JWT string.
   */
  public generateToken(payload: Record<string, any>, expiryMs?: number): string {
    const ttlMs = expiryMs || this.defaultExpiryMs;
    const nowSec = Math.floor(Date.now() / 1000);
    const expSec = nowSec + Math.floor(ttlMs / 1000);

    const fullPayload: JWTPayload = {
      iss: this.issuer,
      aud: this.audience,
      iat: nowSec,
      exp: expSec,
      sub: payload.sub || payload.userId || 'anonymous',
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      ...payload,
    };

    return jwt.sign(fullPayload, this.secret, { algorithm: 'HS256' });
  }

  public async sign(payload: Record<string, any>, expiryMs?: number): Promise<string> {
    return this.generateToken(payload, expiryMs);
  }

  /**
   * Cryptographically verifies and parses a JWT string, throwing AuthenticationError if invalid or expired.
   */
  public verifyToken(token: string): JWTPayload {
    if (!token || typeof token !== 'string') {
      throw new AuthenticationError('JWT token is missing or empty', 'missing_token');
    }

    try {
      const decoded = jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
        issuer: this.issuer,
        audience: this.audience,
      }) as JWTPayload;

      return decoded;
    } catch (err: any) {
      this.logger?.warn?.(`JWT verification failed: ${err.message}`);
      if (err.name === 'TokenExpiredError') {
        throw new AuthenticationError('JWT token has expired', 'expired_token');
      }
      throw new AuthenticationError(`Invalid JWT token: ${err.message}`, 'invalid_token');
    }
  }

  public async verify(token: string): Promise<JWTPayload> {
    return this.verifyToken(token);
  }

  public async validate(token: string): Promise<JWTPayload> {
    return this.verifyToken(token);
  }

  /**
   * Extracts raw JWT string from standard HTTP "Bearer {token}" header format.
   */
  public extractToken(authHeader?: string): string {
    if (!authHeader || typeof authHeader !== 'string') {
      throw new AuthenticationError('Authorization header is missing', 'missing_token');
    }

    const parts = authHeader.trim().split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      throw new AuthenticationError('Authorization header format must be "Bearer {token}"', 'invalid_token');
    }

    return parts[1];
  }

  /**
   * Decodes JWT claims without cryptographic verification.
   */
  public decodeToken(token: string): JWTPayload {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (!decoded) {
        throw new AuthenticationError('Malformed JWT payload', 'invalid_token');
      }
      return decoded;
    } catch (err: any) {
      throw new AuthenticationError(`Failed to decode JWT: ${err.message}`, 'invalid_token');
    }
  }

  public async decode(token: string): Promise<JWTPayload> {
    return this.decodeToken(token);
  }

  /**
   * Checks if JWT claims expiration timestamp has passed.
   */
  public isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded.exp) return false;
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  }

  /**
   * Issues a refreshed token with updated expiration timestamp while maintaining claims.
   */
  public refreshToken(token: string): string {
    const payload = this.decodeToken(token);
    delete payload.iat;
    delete payload.exp;
    return this.generateToken(payload);
  }
}

export { JWTStrategy as JwtStrategy };
