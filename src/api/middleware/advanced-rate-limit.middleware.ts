import { Response, NextFunction } from 'express';
import { ApiRequest } from '../types';
import { AdvancedRateLimiter } from '../../security/rate-limiting/advanced-rate-limiter';
import { RateLimitHeaderBuilder } from '../../security/rate-limiting/rate-limit-headers';

/**
 * Express middleware executing sliding window checks on incoming requests.
 */
export function advancedRateLimitMiddleware(limiter: AdvancedRateLimiter) {
  return async (req: ApiRequest, res: Response, next: NextFunction): Promise<void> => {
    const actorId = req.auth ? req.auth.getPrincipalId() : req.ip || 'global';
    const endpoint = req.originalUrl;

    const check = await limiter.checkRateLimit(actorId, endpoint);
    const headers = RateLimitHeaderBuilder.buildHeaders(check);

    // Apply compliant headers variables keys
    Object.entries(headers).forEach(([k, v]) => {
      res.setHeader(k, v);
    });

    if (!check.allowed) {
      res.status(429).json({ error: 'Too many requests. Rates limit exceeded.' });
      return;
    }

    next();
  };
}
export { RateLimitHeaderBuilder };
