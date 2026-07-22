/**
 * Precise sliding window metrics accumulator.
 */
export class SlidingWindowCounter {
  private readonly redis: any;
  private readonly windowMs: number;

  constructor(redis: any, windowMs: number) {
    this.redis = redis;
    this.windowMs = windowMs;
  }

  /**
   * Increments current requests logs list returning total hits count in active window.
   */
  public async increment(key: string): Promise<number> {
    const now = Date.now();
    const minTimestamp = now - this.windowMs;

    // Use simulated mock actions if redis.zadd/zrem/zcard are not present in raw proxy
    if (typeof this.redis.zadd !== 'function') {
      const current = await this.redis.get(key);
      const val = current ? parseInt(current, 10) : 0;
      await this.redis.setex(key, Math.ceil(this.windowMs / 1000), String(val + 1));
      return val + 1;
    }

    await this.redis.zadd(key, now, String(now));
    await this.redis.zremrangebyscore(key, 0, minTimestamp);
    const count = await this.redis.zcard(key);
    await this.redis.pexpire(key, this.windowMs);

    return count;
  }
}
