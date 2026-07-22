import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthGuard } from '../auth/auth-guard';
import { TokenManager } from '../auth/token-manager';
import { AuthenticationError } from '../errors/authentication-error';

/**
 * Middleware validating headers authorization and mapping results to Request.auth context.
 */
export function authMiddleware(authGuard: AuthGuard, tokenManager: TokenManager): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.header('Authorization');
    const apiKeyHeader = req.header('X-API-Key') || req.header('x-api-key');

    try {
      if (!authHeader && !apiKeyHeader) {
        throw new AuthenticationError('Authorization header or API key is missing', 'missing_token');
      }

      if (authHeader && authHeader.trim().toLowerCase().startsWith('bearer ')) {
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

      (req as any).auth = context;
      next();
    } catch (err: any) {
      next(err instanceof AuthenticationError ? err : new AuthenticationError(err.message));
    }
  };
}
