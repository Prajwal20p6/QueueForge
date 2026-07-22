import { Request, Response, NextFunction, RequestHandler } from 'express';
import { RateLimiter } from '../../security/rate-limiting/rate-limiter';
import { RateLimitError } from '../../security/errors/rate-limit-error';
import { ApiRequest } from '../types';

/**
 * Express middleware enforcing sliding-window rate limits and injecting standard RFC 6585 headers.
 */
export function rateLimitMiddleware(rateLimiter: RateLimiter | any, limit?: number, windowMs?: number): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const apiReq = req as ApiRequest;
    const identifier = apiReq.auth?.getPrincipalId?.() || (apiReq.auth as any)?.userId || (apiReq.auth as any)?.apiKeyId || req.ip || 'anonymous';
    const rateLimitKey = `${req.path}:${identifier}`;

    try {
      if (rateLimiter && typeof rateLimiter.checkLimit === 'function') {
        const result = await rateLimiter.checkLimit(rateLimitKey, limit, windowMs);

        // Attach RFC 6585 headers
        if (typeof rateLimiter.getHeaders === 'function') {
          const headers = rateLimiter.getHeaders(result);
          Object.entries(headers).forEach(([k, v]) => res.setHeader(k, String(v)));
        } else {
          res.setHeader('X-RateLimit-Limit', String(result.limit));
          res.setHeader('X-RateLimit-Remaining', String(result.remaining));
          res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetTime.getTime() / 1000)));
          if (!result.allowed) {
            res.setHeader('Retry-After', String(result.retryAfterSeconds));
          }
        }

        if (!result.allowed) {
          throw new RateLimitError(
            `Rate limit exceeded for key "${rateLimitKey}". Try again in ${result.retryAfterSeconds} seconds.`,
            result.retryAfterSeconds,
            result.limit,
            result.remaining,
            result.resetTime
          );
        }
      }

      next();
    } catch (err: any) {
      next(err);
    }
  };
}
