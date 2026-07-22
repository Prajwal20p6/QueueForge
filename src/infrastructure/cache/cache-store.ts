import { Logger } from 'winston';
import { RedisOperations } from '../redis/redis-operations';
import { KeyBuilder } from '../redis/key-builder';

/**
 * Generic type-safe Cache Store backed by Redis Operations.
 */
export class CacheStore {
  constructor(
    private readonly redisOps: RedisOperations,
    private readonly keyBuilder: typeof KeyBuilder,
    private readonly logger: Logger
  ) {}

  /**
   * Helper to construct keys consistently.
   */
  private buildKey(namespace: string, id: string): string {
    return this.keyBuilder.cacheKey(namespace, id);
  }

  /**
   * Retrieves a cached value, automatically parsing JSON configurations.
   */
  public async get<T>(namespace: string, id: string): Promise<T | null> {
    const key = this.buildKey(namespace, id);
    const value = await this.redisOps.get(key);
    if (value === null) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  /**
   * Caches a value with automatic JSON serialization and TTL enforcement.
   */
  public async set<T>(namespace: string, id: string, value: T, ttlMs: number): Promise<void> {
    const key = this.buildKey(namespace, id);
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.redisOps.set(key, serialized, ttlMs);
  }

  /**
   * Removes a cached entry.
   */
  public async delete(namespace: string, id: string): Promise<void> {
    const key = this.buildKey(namespace, id);
    await this.redisOps.delete(key);
  }

  /**
   * Checks if an entry is cached.
   */
  public async exists(namespace: string, id: string): Promise<boolean> {
    const key = this.buildKey(namespace, id);
    return await this.redisOps.exists(key);
  }

  /**
   * Gets remaining time to live in milliseconds.
   */
  public async getTTL(namespace: string, id: string): Promise<number | null> {
    const key = this.buildKey(namespace, id);
    return await this.redisOps.ttl(key);
  }

  /**
   * Sets or overrides an entry's TTL.
   */
  public async setTTL(namespace: string, id: string, ttlMs: number): Promise<void> {
    const key = this.buildKey(namespace, id);
    await this.redisOps.expire(key, ttlMs);
  }

  /**
   * Increments a namespaced numeric key.
   */
  public async increment(namespace: string, id: string, delta = 1): Promise<number> {
    const key = this.buildKey(namespace, id);
    return await this.redisOps.increment(key, delta);
  }

  /**
   * Decrements a namespaced numeric key.
   */
  public async decrement(namespace: string, id: string, delta = 1): Promise<number> {
    const key = this.buildKey(namespace, id);
    return await this.redisOps.decrement(key, delta);
  }

  /**
   * Resolves a value from cache, or fetches it dynamically using the fetcher and caches it.
   */
  public async getOrFetch<T>(
    namespace: string,
    id: string,
    fetcher: () => Promise<T>,
    ttlMs: number
  ): Promise<T> {
    const cached = await this.get<T>(namespace, id);
    if (cached !== null) {
      return cached;
    }
    const fresh = await fetcher();
    await this.set<T>(namespace, id, fresh, ttlMs);
    return fresh;
  }

  /**
   * Invalidates multiple cache keys matching a specific pattern.
   */
  public async invalidatePattern(pattern: string): Promise<number> {
    this.logger.debug(`[CacheStore] Invalidating keys with pattern: ${pattern}`);
    return await this.redisOps.deleteByPattern(pattern);
  }
}
