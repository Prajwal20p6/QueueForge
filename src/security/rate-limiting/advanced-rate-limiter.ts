import { Logger } from '../../observability/logging/logger';
import { SlidingWindowCounter } from './sliding-window';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Controller enforcing endpoint rate limits metrics checks.
 */
export class AdvancedRateLimiter {
  private readonly redis: any;
  private readonly logger: Logger;

  constructor(redis: any, logger: Logger) {
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Asserts request limit checks.
   */
  public async checkRateLimit(identifier: string, endpoint: string): Promise<RateLimitResult> {
    const key = `ratelimit:${identifier}:${endpoint}`;
    const counter = new SlidingWindowCounter(this.redis, 60000); // 1 minute window
    const currentUsage = await counter.increment(key);

    const limit = 1000; // Simulated limit value
    const remaining = Math.max(0, limit - currentUsage);

    if (currentUsage > limit) {
      this.logger.warn(`[AdvancedRateLimiter] Rate limit breached for: ${identifier} on ${endpoint}`);
      return { allowed: false, limit, remaining: 0, resetSeconds: 60 };
    }

    return { allowed: true, limit, remaining, resetSeconds: 60 };
  }
}
