import crypto from 'crypto';
import { JWTStrategy, JWTPayload } from './jwt-strategy';
import { AuthenticationError } from '../errors/authentication-error';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';
import { RedisOperations } from '../../infrastructure/redis/redis-operations';
import { KeyBuilder } from '../../infrastructure/redis/key-builder';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt?: Date;
}

/**
 * Service managing access/refresh tokens, token revocation blacklisting, and lifecycle rotation.
 */
export class TokenManager {
  private readonly inMemoryBlacklist = new Set<string>();

  constructor(
    private readonly jwtStrategy: JWTStrategy | any,
    private readonly redisOps?: RedisOperations | any,
    private readonly keyBuilder?: KeyBuilder | any,
    private readonly logger?: Logger | any
  ) {}

  private getBlacklistKey(tokenHash: string): string {
    if (this.keyBuilder && typeof this.keyBuilder.buildKey === 'function') {
      return this.keyBuilder.buildKey('token-blacklist', tokenHash);
    }
    return `queueforge:token-blacklist:${tokenHash}`;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async signJwt(payload: any, expiryMs?: number): Promise<string> {
    if (typeof this.jwtStrategy.sign === 'function') {
      return await this.jwtStrategy.sign(payload, expiryMs);
    }
    return this.jwtStrategy.generateToken(payload, expiryMs);
  }

  private async decodeJwt(token: string): Promise<JWTPayload> {
    if (typeof this.jwtStrategy.decode === 'function') {
      return await this.jwtStrategy.decode(token);
    }
    return this.jwtStrategy.decodeToken(token);
  }

  private async verifyJwt(token: string): Promise<JWTPayload> {
    if (typeof this.jwtStrategy.validate === 'function') {
      return await this.jwtStrategy.validate(token);
    }
    if (typeof this.jwtStrategy.verify === 'function') {
      return await this.jwtStrategy.verify(token);
    }
    return this.jwtStrategy.verifyToken(token);
  }

  /**
   * Issues a short-lived signed access JWT for an authenticated subject.
   */
  public async generateAccessToken(userId: string, roles: string[] = ['USER'], expiryMs?: number): Promise<string> {
    return this.signJwt(
      {
        sub: userId,
        roles,
        type: 'access',
      },
      expiryMs
    );
  }

  /**
   * Issues a long-lived signed refresh JWT for credential rotation.
   */
  public async generateRefreshToken(userId: string, expiryMs = 604800000): Promise<string> {
    return this.signJwt(
      {
        sub: userId,
        type: 'refresh',
      },
      expiryMs
    );
  }

  /**
   * Issues both access and refresh tokens for a user ID.
   */
  public async issueToken(userId: string, roles: string[] = ['USER']): Promise<IssuedTokens> {
    const accessToken = await this.generateAccessToken(userId, roles);
    const refreshToken = await this.generateRefreshToken(userId);

    let expiresAt = new Date(Date.now() + 3600 * 1000);
    try {
      const decoded = await this.decodeJwt(accessToken);
      if (decoded && decoded.exp) {
        expiresAt = new Date(decoded.exp * 1000);
      }
    } catch {
      // ignore
    }

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      expiresAt,
    };
  }

  /**
   * Verifies an access token and confirms it is not blacklisted.
   */
  public async verifyAccessToken(token: string): Promise<JWTPayload> {
    if (await this.isTokenRevoked(token)) {
      throw new AuthenticationError('JWT token has been revoked', 'revoked_token');
    }

    const payload = await this.verifyJwt(token);
    if (payload.type && payload.type !== 'access') {
      throw new AuthenticationError('Token type must be an access token', 'invalid_token');
    }

    return payload;
  }

  /**
   * Verifies a refresh token and confirms it is not blacklisted.
   */
  public async verifyRefreshToken(token: string): Promise<JWTPayload> {
    if (await this.isTokenRevoked(token)) {
      throw new AuthenticationError('Refresh token has been revoked', 'revoked_token');
    }

    const payload = await this.verifyJwt(token);
    if (payload.type !== 'refresh' && payload.type !== undefined) {
      throw new AuthenticationError('Token type must be a refresh token', 'invalid_token');
    }

    return payload;
  }

  /**
   * Blacklists a JWT in Redis until its natural expiration timestamp.
   */
  public async revokeToken(token: string): Promise<void> {
    try {
      const decoded = await this.decodeJwt(token);
      const nowSec = Math.floor(Date.now() / 1000);
      const ttlSec = Math.max(1, (decoded.exp || nowSec + 3600) - nowSec);

      const tokenHash = this.hashToken(token);
      this.inMemoryBlacklist.add(tokenHash);

      if (this.redisOps) {
        if (typeof this.redisOps.setex === 'function') {
          await this.redisOps.setex(`revoked_token:${token}`, ttlSec, 'revoked');
        } else if (typeof this.redisOps.set === 'function') {
          const key = this.getBlacklistKey(tokenHash);
          await this.redisOps.set(key, 'revoked', ttlSec);
        }
      }

      this.logger?.info?.(`Token for subject "${decoded?.sub}" revoked successfully.`);
    } catch (err: any) {
      this.logger?.error?.(`Failed to revoke token: ${err.message}`);
      throw err;
    }
  }

  /**
   * Checks whether a token hash is present in the Redis blacklist.
   */
  public async isTokenRevoked(token: string): Promise<boolean> {
    try {
      const tokenHash = this.hashToken(token);
      if (this.inMemoryBlacklist.has(tokenHash)) return true;

      if (this.redisOps) {
        if (typeof this.redisOps.exists === 'function') {
          const res = await this.redisOps.exists(`revoked_token:${token}`);
          if (res) return true;
        }
        if (typeof this.redisOps.get === 'function') {
          const key = this.getBlacklistKey(tokenHash);
          const val = await this.redisOps.get(key);
          if (val === 'revoked' || val === '1') return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Verifies a refresh token and issues a new access token or returned current token if under threshold.
   */
  public async refreshToken(refreshToken: string): Promise<any> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const nowSec = Math.floor(Date.now() / 1000);
    const remainingSec = (payload.exp || nowSec + 3600) - nowSec;

    // Threshold check (5 minutes = 300 seconds)
    if (remainingSec > 300) {
      return {
        accessToken: refreshToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: remainingSec,
      };
    }

    await this.revokeToken(refreshToken);

    const newAccessToken = await this.generateAccessToken(payload.sub, payload.roles || payload.scope || ['USER']);
    const newRefreshToken = await this.generateRefreshToken(payload.sub);

    let expiresAt = new Date(Date.now() + 3600 * 1000);
    try {
      const decoded = await this.decodeJwt(newAccessToken);
      if (decoded && decoded.exp) {
        expiresAt = new Date(decoded.exp * 1000);
      }
    } catch {
      // ignore
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      expiresAt,
    };
  }
}
