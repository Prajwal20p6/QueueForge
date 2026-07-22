import { SlidingWindowCounter } from './sliding-window-counter';
import { RateLimitError } from '../errors/rate-limit-error';
import { RateLimitingConfig } from '../../config/rate-limiting.config';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';
import { RedisOperations } from '../../infrastructure/redis/redis-operations';

export interface RateLimitCheckResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfterSeconds: number;
}

/**
 * Service enforcing rate limits, computing remaining capacities, and generating HTTP headers (RFC 6585).
 */
export class RateLimiter {
  private readonly counter: SlidingWindowCounter;
  private readonly defaultLimit: number;
  private readonly defaultWindowMs: number;

  constructor(
    redisOps?: RedisOperations | any,
    _keyBuilder?: any,
    config?: RateLimitingConfig | any,
    private readonly logger?: Logger | any
  ) {
    this.counter = new SlidingWindowCounter(redisOps, logger);
    this.defaultLimit = config?.maxRequests || config?.rateLimiting?.maxRequests || 100;
    this.defaultWindowMs = config?.windowMs || config?.rateLimiting?.windowMs || 60000;
  }

  /**
   * Asserts whether a key has exceeded its allowed hit capacity over the windowMs duration.
   */
  public async checkLimit(
    key: string,
    limit: number = this.defaultLimit,
    windowMs: number = this.defaultWindowMs
  ): Promise<RateLimitCheckResult> {
    const currentCount = await this.counter.increment(key, windowMs);
    const remaining = Math.max(0, limit - currentCount);
    const resetTime = new Date(Date.now() + windowMs);
    const retryAfterSeconds = Math.ceil(windowMs / 1000);
    const allowed = currentCount <= limit;

    if (!allowed) {
      this.logger?.warn?.(`Rate limit exceeded for key "${key}". Hits: ${currentCount}/${limit}`);
    }

    return {
      allowed,
      limit,
      remaining,
      resetTime,
      retryAfterSeconds,
    };
  }

  /**
   * Asserts rate limit throwing RateLimitError if breached.
   */
  public async consumeOrThrow(key: string, limit?: number, windowMs?: number): Promise<RateLimitCheckResult> {
    const result = await this.checkLimit(key, limit, windowMs);
    if (!result.allowed) {
      throw new RateLimitError(
        `Rate limit exceeded for key "${key}". Try again in ${result.retryAfterSeconds} seconds.`,
        result.retryAfterSeconds,
        result.limit,
        result.remaining,
        result.resetTime
      );
    }
    return result;
  }

  public async isAllowed(key: string, limit?: number): Promise<boolean> {
    const res = await this.checkLimit(key, limit);
    return res.allowed;
  }

  public async recordRequest(key: string): Promise<number> {
    return this.increment(key);
  }

  public getRefilledBucket(): any {
    return null;
  }

  public async increment(key: string, delta: number = 1): Promise<number> {
    let count = 0;
    for (let i = 0; i < delta; i++) {
      count = await this.counter.increment(key, this.defaultWindowMs);
    }
    return count;
  }

  public async reset(key: string): Promise<void> {
    await this.counter.reset(key);
  }

  public async getRemaining(key: string, limit: number = this.defaultLimit): Promise<number> {
    const count = await this.counter.getCount(key, this.defaultWindowMs);
    return Math.max(0, limit - count);
  }

  public async getReset(_key: string, windowMs: number = this.defaultWindowMs): Promise<Date> {
    return new Date(Date.now() + windowMs);
  }

  /**
   * Formats HTTP headers according to standard RFC 6585 rate limiting parameters.
   */
  public getHeaders(result: RateLimitCheckResult): Record<string, string> {
    return {
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(Math.ceil(result.resetTime.getTime() / 1000)),
      ...(result.allowed ? {} : { 'Retry-After': String(result.retryAfterSeconds) }),
    };
  }
}
