/**
 * Subject details mapped from successful authentication sessions.
 */
export interface AuthContextInfo {
  type: 'jwt' | 'api_key';
  subject: string;
  scopes: string[];
  tenantId?: string;
  issuedAt: Date;
  expiresAt: Date;
}

/**
 * Access token credentials parsed from request channels.
 */
export interface AuthCredentials {
  token?: string;
  apiKey?: string;
}

/**
 * Rate limit metadata status.
 */
export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}
