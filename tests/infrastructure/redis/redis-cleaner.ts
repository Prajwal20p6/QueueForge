import Redis from 'ioredis';

/**
 * Utility for clearing Redis keys between tests.
 */
export class RedisCleaner {
  constructor(private readonly redis: Redis) {}

  public async flushAll(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch {
      // Ignore in offline mock environments
    }
  }
}
