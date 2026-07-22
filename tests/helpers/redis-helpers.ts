import Redis from 'ioredis';

/**
 * Provides utilities to inspect, manipulate, and reset Redis state during tests.
 *
 * @example
 * ```typescript
 * const rh = new RedisTestHelper(redis);
 * await rh.flushAll();
 * await rh.set('key', { value: 1 });
 * const val = await rh.get('key');
 * ```
 */
export class RedisTestHelper {
  private readonly redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Removes all keys from the current Redis database (FLUSHDB).
   */
  public async cleanup(): Promise<void> {
    await this.redis.flushdb();
  }

  /**
   * Sets a key-value pair, serializing the value to JSON.
   * @param key - Redis key.
   * @param value - Any JSON-serializable value.
   * @param ttlSeconds - Optional TTL in seconds.
   */
  public async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds !== undefined) {
      await this.redis.setex(key, ttlSeconds, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  /**
   * Gets and deserializes a JSON value from Redis.
   * Returns null if the key does not exist.
   * @param key - Redis key.
   */
  public async get<T = unknown>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  /**
   * Deletes a key from Redis.
   * @param key - Redis key to delete.
   */
  public async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * Flushes the entire current Redis database.
   */
  public async flushAll(): Promise<void> {
    await this.redis.flushdb();
  }

  /**
   * Returns all keys matching an optional pattern (default: '*').
   * @param pattern - Redis glob pattern.
   */
  public async getAllKeys(pattern = '*'): Promise<string[]> {
    return this.redis.keys(pattern);
  }

  /**
   * Returns a snapshot of key Redis INFO statistics.
   */
  public async getStats(): Promise<Record<string, string>> {
    const raw = await this.redis.info();
    const stats: Record<string, string> = {};
    for (const line of raw.split('\r\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const k = line.slice(0, colonIdx).trim();
        const v = line.slice(colonIdx + 1).trim();
        stats[k] = v;
      }
    }
    return stats;
  }

  /**
   * Returns true if the key exists in Redis.
   * @param key - Redis key to check.
   */
  public async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  /**
   * Returns the underlying ioredis client.
   */
  public getClient(): Redis {
    return this.redis;
  }
}
