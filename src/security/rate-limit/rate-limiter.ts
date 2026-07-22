import { EventEmitter } from 'events';
import Redis from 'ioredis';
import client from 'prom-client';
import { SecurityConfig } from '../../config/security';
import { logger as globalLogger } from '../../infrastructure/logging/logger';

export interface TokenBucketState {
  tokens: number;
  lastRefillAt: number;
}

// Register prometheus metrics counters and gauges
export const rlHitsCounter =
  (client.register.getSingleMetric('rate_limit_hits_total') as client.Counter) ||
  new client.Counter({
    name: 'rate_limit_hits_total',
    help: 'Total number of rate limiter checks executed',
  });

export const rlViolationsCounter =
  (client.register.getSingleMetric('rate_limit_violations_total') as client.Counter) ||
  new client.Counter({
    name: 'rate_limit_violations_total',
    help: 'Total number of rate limit breaches triggered',
  });

export const rlRemainingGauge =
  (client.register.getSingleMetric('rate_limit_remaining') as client.Gauge) ||
  new client.Gauge({
    name: 'rate_limit_remaining',
    help: 'Remaining allowed requests quota in current rate limit bucket',
    labelNames: ['key'],
  });

/**
 * Distributed rate limiter implementing the Token Bucket algorithm backed by Redis.
 */
export class RateLimiter extends EventEmitter {
  private readonly redis: Redis;
  private readonly logger: any;

  constructor(redisClient: Redis, _config?: SecurityConfig, logger?: any, _metrics?: any) {
    super();
    this.redis = redisClient;
    this.logger = logger || globalLogger;
  }

  /**
   * Evaluates bucket state and refills tokens based on elapsed time, decrementing if allowed.
   */
  private async getRefilledBucket(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ state: TokenBucketState; refillRate: number }> {
    const now = Date.now();
    const cacheKey = `rate_limiter:${key}`;
    const cached = await this.redis.get(cacheKey);

    const refillRate = limit / windowSeconds; // tokens per second

    if (!cached) {
      return {
        state: { tokens: limit, lastRefillAt: now },
        refillRate,
      };
    }

    const state = JSON.parse(cached) as TokenBucketState;
    const elapsedSeconds = (now - state.lastRefillAt) / 1000;
    const refilledTokens = elapsedSeconds * refillRate;

    const currentTokens = Math.min(limit, state.tokens + refilledTokens);

    return {
      state: { tokens: currentTokens, lastRefillAt: now },
      refillRate,
    };
  }

  /**
   * Asserts if request complies with token quotas, updating bucket levels.
   * Maintained for backwards compatibility.
   */
  public async isAllowed(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    rlHitsCounter.inc();
    const { state } = await this.getRefilledBucket(key, limit, windowSeconds);

    if (state.tokens >= 1) {
      state.tokens -= 1;
      const cacheKey = `rate_limiter:${key}`;
      await this.redis.setex(cacheKey, windowSeconds, JSON.stringify(state));

      rlRemainingGauge.set({ key }, Math.floor(state.tokens));

      const ratio = state.tokens / limit;
      if (ratio <= 0.1) {
        this.logger.warn(
          `Rate limit warning: key "${key}" is approaching limit (${Math.round(ratio * 100)}% remaining)`
        );
      }

      return true;
    }

    rlViolationsCounter.inc();
    this.logger.error(`Rate limit exceeded for key: "${key}"`);
    return false;
  }

  /**
   * Main entry method checking rate limits and emitting events on breaches.
   */
  public async checkLimit(
    key: string,
    maxRequests: number,
    windowSeconds = 60
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const allowed = await this.isAllowed(key, maxRequests, windowSeconds);
    const remaining = await this.getRemainingRequests(key, maxRequests, windowSeconds);
    const stats = await this.getStats(key, maxRequests, windowSeconds);

    if (!allowed) {
      this.emit('RateLimitedEvent', { key, limit: maxRequests, windowSeconds });
    }

    return {
      allowed,
      remaining,
      resetAt: stats.resetAt,
    };
  }

  /**
   * Dummy method logging worker requests registration.
   */
  public async recordRequest(key: string): Promise<void> {
    this.logger.debug(`Registering rate limit check request for key: "${key}"`);
  }

  /**
   * Retrieves remaining allowed requests before the bucket is empty.
   * Maintained for backwards compatibility.
   */
  public async getRemainingRequests(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<number> {
    const { state } = await this.getRefilledBucket(key, limit, windowSeconds);
    return Math.max(0, Math.floor(state.tokens));
  }

  /**
   * Resets rate limit key.
   */
  public async reset(key: string): Promise<void> {
    const cacheKey = `rate_limiter:${key}`;
    await this.redis.del(cacheKey);
    this.logger.info(`Rate limit reset for key: "${key}"`);
  }

  /**
   * Gathers statistics, including limits, remaining tokens, and reset times.
   * Maintained for backwards compatibility.
   */
  public async getStats(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ requests: number; limit: number; resetAt: Date; remainingMs: number }> {
    const { state, refillRate } = await this.getRefilledBucket(key, limit, windowSeconds);
    const remainingMs = refillRate > 0 ? ((limit - state.tokens) / refillRate) * 1000 : 0;
    const resetAt = new Date(Date.now() + remainingMs);

    return {
      requests: Math.max(0, Math.round(limit - state.tokens)),
      limit,
      resetAt,
      remainingMs: Math.round(remainingMs),
    };
  }
}
export { SecurityConfig };
export { TokenBucketState as TokenBucketStateClass };
