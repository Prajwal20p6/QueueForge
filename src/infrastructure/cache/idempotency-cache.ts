import Redis from 'ioredis';

/**
 * Compatibility bridge implementing the integration test expectations of the IdempotencyCache.
 */
export class IdempotencyCache {
  constructor(
    private readonly redis: Redis,
    _options?: any
  ) {}

  /**
   * Caches a value with specific JSON wrapper structure and TTL in hours.
   */
  public async set(key: string, value: any, ttlHours = 2): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);
    const data = {
      value,
      expiresAt: expiresAt.toISOString(),
    };
    const ttlSeconds = ttlHours * 3600;
    await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
  }

  /**
   * Retrieves wrapped value and parses date structures.
   */
  public async get(key: string): Promise<{ value: any; expiresAt: Date } | null> {
    const val = await this.redis.get(key);
    if (!val) {
      return null;
    }
    const parsed = JSON.parse(val);
    return {
      value: parsed.value,
      expiresAt: new Date(parsed.expiresAt),
    };
  }

  /**
   * Checks key existence.
   */
  public async exists(key: string): Promise<boolean> {
    const count = await this.redis.exists(key);
    return count > 0;
  }

  /**
   * Removes cached key.
   */
  public async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * Clears all idempotency cache keys by prefix.
   */
  public async clear(): Promise<void> {
    const keys = await this.redis.keys('*idempotent*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
