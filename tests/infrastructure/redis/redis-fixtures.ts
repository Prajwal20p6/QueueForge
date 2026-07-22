import Redis from 'ioredis';

/**
 * Fixture generator for Redis keys.
 */
export class RedisFixtures {
  constructor(private readonly redis: Redis) {}

  public async seedHeartbeats(count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.redis.set(`queueforge:heartbeat:worker-${i}`, Date.now().toString()).catch(() => {});
    }
  }
}
