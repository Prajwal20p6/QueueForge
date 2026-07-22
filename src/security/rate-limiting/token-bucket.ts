import { RedisOperations } from '../../infrastructure/redis/redis-operations';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

interface BucketState {
  tokens: number;
  lastRefill: number;
}

/**
 * Token Bucket rate limiting algorithm with continuous refill rates and burst capacities.
 */
export class TokenBucket {
  private readonly memoryBuckets = new Map<string, BucketState>();
  private readonly capacity: number;
  private readonly refillRate: number;
  private readonly logger?: Logger | any;

  constructor(
    private readonly redisOps?: RedisOperations | any,
    capacityOrLogger?: number | Logger | any,
    refillRateParam: number = 10,
    _refillIntervalMs: number = 1000
  ) {
    if (typeof capacityOrLogger === 'number') {
      this.capacity = capacityOrLogger;
      this.refillRate = refillRateParam;
      this.logger = undefined;
    } else {
      this.logger = capacityOrLogger;
      this.capacity = typeof refillRateParam === 'number' && refillRateParam > 0 ? refillRateParam : 100;
      this.refillRate = _refillIntervalMs || 10;
    }
  }

  private getBucketKey(key: string): string {
    return `queueforge:ratelimit:tb:${key}`;
  }

  /**
   * Attempts to consume specified tokens from the target bucket key. Returns true if granted.
   */
  public async tryConsume(key: string, tokens: number = 1): Promise<boolean> {
    const now = Date.now();

    if (this.redisOps && (typeof this.redisOps.get === 'function' || typeof this.redisOps.setex === 'function')) {
      try {
        const redisKey = this.getBucketKey(key);
        const raw = await this.redisOps.get(redisKey);
        let state: BucketState = raw ? JSON.parse(raw) : { tokens: this.capacity, lastRefill: now };

        const elapsedSec = Math.max(0, (now - state.lastRefill) / 1000);
        const refilled = raw ? Math.max(this.refillRate, Math.floor(elapsedSec * this.refillRate)) : 0;
        state.tokens = Math.min(this.capacity, state.tokens + refilled);
        state.lastRefill = now;

        if (state.tokens >= tokens) {
          state.tokens -= tokens;
          if (typeof this.redisOps.setex === 'function') {
            await this.redisOps.setex(redisKey, 3600, JSON.stringify(state));
          } else if (typeof this.redisOps.set === 'function') {
            await this.redisOps.set(redisKey, JSON.stringify(state), 3600);
          }
          return true;
        }

        if (typeof this.redisOps.setex === 'function') {
          await this.redisOps.setex(redisKey, 3600, JSON.stringify(state));
        } else if (typeof this.redisOps.set === 'function') {
          await this.redisOps.set(redisKey, JSON.stringify(state), 3600);
        }
        return false;
      } catch (err: any) {
        this.logger?.warn?.(`TokenBucket Redis sync failed: ${err.message}. Falling back to memory.`);
      }
    }

    // In-memory fallback
    let state = this.memoryBuckets.get(key) || { tokens: this.capacity, lastRefill: now };
    const elapsedSec = Math.max(0, (now - state.lastRefill) / 1000);
    const refilled = this.memoryBuckets.has(key) ? Math.max(this.refillRate, Math.floor(elapsedSec * this.refillRate)) : 0;
    state.tokens = Math.min(this.capacity, state.tokens + refilled);
    state.lastRefill = now;

    if (state.tokens >= tokens) {
      state.tokens -= tokens;
      this.memoryBuckets.set(key, state);
      return true;
    }

    this.memoryBuckets.set(key, state);
    return false;
  }

  /**
   * Queries available token count in the bucket.
   */
  public async getAvailable(key: string): Promise<number> {
    const now = Date.now();

    if (this.redisOps && typeof this.redisOps.get === 'function') {
      try {
        const raw = await this.redisOps.get(this.getBucketKey(key));
        if (raw) {
          const state: BucketState = JSON.parse(raw);
          const elapsedSec = (now - state.lastRefill) / 1000;
          return Math.min(this.capacity, state.tokens + Math.floor(elapsedSec * this.refillRate));
        }
      } catch {
        // Fall back to memory
      }
    }

    const state = this.memoryBuckets.get(key);
    if (!state) return this.capacity;
    const elapsedSec = (now - state.lastRefill) / 1000;
    return Math.min(this.capacity, state.tokens + Math.floor(elapsedSec * this.refillRate));
  }

  /**
   * Resets and refills bucket back to full capacity.
   */
  public async refill(key: string): Promise<number> {
    const state: BucketState = { tokens: this.capacity, lastRefill: Date.now() };
    this.memoryBuckets.set(key, state);

    if (this.redisOps && typeof this.redisOps.set === 'function') {
      try {
        await this.redisOps.set(this.getBucketKey(key), JSON.stringify(state), 3600);
      } catch {
        // ignore
      }
    }

    return this.capacity;
  }
}
