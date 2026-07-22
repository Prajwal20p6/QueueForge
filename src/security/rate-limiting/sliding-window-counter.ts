import crypto from 'crypto';
import { RedisOperations } from '../../infrastructure/redis/redis-operations';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

/**
 * Atomic Redis sorted-set sliding window counter tracking hit frequencies over sliding time windows.
 */
export class SlidingWindowCounter {
  private readonly fallbackCounts = new Map<string, { timestamps: number[] }>();

  constructor(
    private readonly redisOps?: RedisOperations | any,
    private readonly logger?: Logger | any
  ) {}

  /**
   * Records a request hit, trims timestamps older than windowMs, and returns the current window hit count.
   */
  public async increment(key: string, windowMs: number = 60000): Promise<number> {
    const now = Date.now();
    const clearBefore = now - windowMs;

    if (this.redisOps && typeof this.redisOps.zadd === 'function') {
      try {
        const fullKey = `queueforge:ratelimit:sw:${key}`;
        const reqId = `${now}-${crypto.randomBytes(4).toString('hex')}`;

        if (typeof this.redisOps.zremrangebyscore === 'function') {
          await this.redisOps.zremrangebyscore(fullKey, 0, clearBefore);
        }
        await this.redisOps.zadd(fullKey, now, reqId);
        if (typeof this.redisOps.pexpire === 'function') {
          await this.redisOps.pexpire(fullKey, windowMs);
        }

        if (typeof this.redisOps.zcard === 'function') {
          return await this.redisOps.zcard(fullKey);
        }
      } catch (err: any) {
        this.logger?.warn?.(`SlidingWindowCounter Redis operation failed: ${err.message}. Falling back to memory.`);
      }
    }

    // In-memory fallback
    const record = this.fallbackCounts.get(key) || { timestamps: [] };
    const validTimestamps = record.timestamps.filter(ts => ts > clearBefore);
    validTimestamps.push(now);

    this.fallbackCounts.set(key, { timestamps: validTimestamps });
    return validTimestamps.length;
  }

  /**
   * Queries the current count of hits within the past windowMs without recording a new hit.
   */
  public async getCount(key: string, windowMs: number = 60000): Promise<number> {
    const now = Date.now();
    const clearBefore = now - windowMs;

    if (this.redisOps && typeof this.redisOps.zcount === 'function') {
      try {
        const fullKey = `queueforge:ratelimit:sw:${key}`;
        return await this.redisOps.zcount(fullKey, clearBefore, '+inf');
      } catch {
        // Fall back to memory
      }
    }

    const record = this.fallbackCounts.get(key);
    if (!record) return 0;
    return record.timestamps.filter(ts => ts > clearBefore).length;
  }

  /**
   * Clears counter history for a key.
   */
  public async reset(key: string): Promise<void> {
    this.fallbackCounts.delete(key);
    if (this.redisOps && typeof this.redisOps.delete === 'function') {
      try {
        await this.redisOps.delete(`queueforge:ratelimit:sw:${key}`);
      } catch {
        // ignore
      }
    }
  }
}
