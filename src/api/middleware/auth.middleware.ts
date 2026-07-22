import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthGuard } from '../../security/auth/auth-guard';
import { TokenManager } from '../../security/auth/token-manager';
import { AuthenticationError } from '../../security/errors/authentication-error';
import { ApiRequest } from '../types';

/**
 * Middleware extracting request authentication credentials (JWT or API Key) and binding AuthContext to req.auth.
 */
export function authMiddleware(authGuard: AuthGuard, tokenManager?: TokenManager): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.header('Authorization');
    const apiKeyHeader = req.header('X-API-Key') || req.header('x-api-key');

    try {
      if (!authHeader && !apiKeyHeader) {
        throw new AuthenticationError('Authorization header or API key is missing', 'missing_token');
      }

      // If token manager is present and JWT bearer is passed, verify revocation status
      if (tokenManager && authHeader && authHeader.trim().toLowerCase().startsWith('bearer ')) {
        const rawToken = authHeader.trim().substring(7);
        const isRevoked = await tokenManager.isTokenRevoked(rawToken);
        if (isRevoked) {
          throw new AuthenticationError('Token has been revoked', 'revoked_token');
        }
      }

      const context = await authGuard.authenticate(
        authHeader,
        apiKeyHeader,
        req.header('X-Signature') || req.header('x-signature'),
        req.header('X-Timestamp') || req.header('x-timestamp')
      );

      (req as ApiRequest).auth = context as any;
      next();
    } catch (err: any) {
      next(err instanceof AuthenticationError ? err : new AuthenticationError(err.message, 'invalid_credentials'));
    }
  };
}

export const authenticate = authMiddleware;
