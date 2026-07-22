import { Logger } from '../../observability/logging/logger';

/**
 * Cache manager utilizing Redis backend keys to store dashboards metrics.
 */
export class AnalyticsCache {
  private readonly redis: any;
  private readonly logger: Logger;

  constructor(redis: any, logger: Logger) {
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Caches a query result.
   */
  public async cacheResult(key: string, value: any, ttlSeconds = 300): Promise<void> {
    const cacheKey = `analytics:cache:${key}`;
    this.logger.debug(`[AnalyticsCache] Storing analytics keys: ${cacheKey}`);
    await this.redis.setex(cacheKey, ttlSeconds, JSON.stringify(value));
  }

  /**
   * Retrieves cached query results.
   */
  public async getCachedResult(key: string): Promise<any | null> {
    const cacheKey = `analytics:cache:${key}`;
    const raw = await this.redis.get(cacheKey);
    if (!raw) return null;
    return JSON.parse(raw);
  }
}
