import { Request, Response, NextFunction, RequestHandler } from 'express';
import { RateLimiter } from '../rate-limit/rate-limiter';
import { RateLimitConfig, getRateLimitThreshold } from '../rate-limit/thresholds';
import { buildRateLimitKey } from '../rate-limit/key-builder';
import { RateLimitError } from '../../shared/errors/rate-limit-error';

/**
 * Middleware enforcing distributed rate limiting per client or route endpoint.
 * Sets X-RateLimit headers and Retry-After backoffs when limits are exhausted.
 */
export function rateLimitMiddleware(
  limiter: RateLimiter,
  thresholds: RateLimitConfig
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const auth = (req as any).auth;
    let apiKey: string | undefined;
    let userId: string | undefined;

    if (auth) {
      if (auth.type === 'api-key') {
        apiKey = auth.getPrincipalId();
      } else if (auth.type === 'jwt') {
        userId = auth.getPrincipalId();
      }
    } else {
      userId = req.ip || 'anonymous';
    }

    const endpoint = req.path;
    const { limit, windowSeconds } = getRateLimitThreshold(thresholds, endpoint, apiKey, userId);
    const key = buildRateLimitKey(apiKey, endpoint, userId);

    try {
      const allowed = await limiter.isAllowed(key, limit, windowSeconds);
      const stats = await limiter.getStats(key, limit, windowSeconds);

      res.setHeader('X-RateLimit-Limit', String(limit));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - stats.requests)));
      res.setHeader('X-RateLimit-Reset', String(Math.round(stats.resetAt.getTime() / 1000)));

      if (!allowed) {
        const retryAfterSeconds = Math.max(1, Math.round(stats.remainingMs / 1000));
        res.setHeader('Retry-After', String(retryAfterSeconds));

        throw new RateLimitError('Rate limit exceeded. Please try again later.', {
          limit,
          windowSeconds,
          retryAfterSeconds,
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
