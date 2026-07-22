import { Logger } from 'winston';
import { RedisOperations } from '../redis/redis-operations';

/**
 * Manages custom TTL expiration trackers and periodic background key evictions.
 */
export class TTLManager {
  private readonly trackerKey = 'queueforge:ttl_tracker';
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private readonly redisOps: RedisOperations,
    private readonly logger: Logger
  ) {
    this.startBackgroundCleanup();
  }

  /**
   * Schedules a key for tracking with a given TTL.
   */
  public async schedule(key: string, ttlMs: number): Promise<void> {
    const expiry = Date.now() + ttlMs;
    await this.redisOps.zadd(this.trackerKey, expiry, key);
    await this.redisOps.expire(key, ttlMs);
    this.logger.debug(`[TTLManager] Scheduled key "${key}" to expire in ${ttlMs}ms.`);
  }

  /**
   * Unschedules tracking for a key.
   */
  public async unschedule(key: string): Promise<void> {
    await this.redisOps.srem(this.trackerKey, [key]);
    await this.redisOps.delete(key);
    this.logger.debug(`[TTLManager] Unscheduled key "${key}".`);
  }

  /**
   * Extends the TTL of a tracked key.
   */
  public async extend(key: string, additionalTtlMs: number): Promise<void> {
    const currentTtl = await this.redisOps.ttl(key);
    const newTtl = (currentTtl || 0) + additionalTtlMs;
    const expiry = Date.now() + newTtl;
    await this.redisOps.zadd(this.trackerKey, expiry, key);
    await this.redisOps.expire(key, newTtl);
    this.logger.debug(`[TTLManager] Extended key "${key}" TTL by ${additionalTtlMs}ms (New TTL: ${newTtl}ms).`);
  }

  /**
   * Retrieves the scheduled expiry date of a tracked key.
   */
  public async getExpiry(key: string): Promise<Date | null> {
    const client = (this.redisOps as any).client;
    const score = await client.zscore(this.trackerKey, key);
    if (!score) return null;
    return new Date(parseInt(score, 10));
  }

  /**
   * Checks if a key has exceeded its expiry date.
   */
  public async isExpired(key: string): Promise<boolean> {
    const expiry = await this.getExpiry(key);
    if (!expiry) return true;
    return Date.now() > expiry.getTime();
  }

  /**
   * Scans and evicts all expired tracked keys.
   */
  public async cleanupExpired(): Promise<number> {
    const now = Date.now();
    const expiredKeys = await this.redisOps.zrangebyscore(this.trackerKey, 0, now);
    if (expiredKeys.length === 0) return 0;

    this.logger.info(`[TTLManager] Found ${expiredKeys.length} expired keys. Evicting...`);

    const client = (this.redisOps as any).client;
    let evictedCount = 0;

    for (const key of expiredKeys) {
      const deleted = await this.redisOps.delete(key);
      if (deleted) evictedCount++;
      await client.zrem(this.trackerKey, key);
      this.logger.info(`[TTLManager] Key "${key}" expired and has been evicted.`);
    }

    return evictedCount;
  }

  /**
   * Starts periodic background task runner.
   */
  public startBackgroundCleanup(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.cleanupExpired().catch((err) => {
        this.logger.error(`[TTLManager] Error in background cleanup cycle: ${err.message}`);
      });
    }, 30000); // every 30 seconds
    this.intervalId.unref?.(); // let node exit even if timer is active
  }

  /**
   * Stops background task runner.
   */
  public stopBackgroundCleanup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
