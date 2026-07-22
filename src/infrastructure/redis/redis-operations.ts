import Redis from 'ioredis';
import { Logger } from 'winston';
import { InfrastructureError } from '../../shared/errors/infrastructure-error';
import { ErrorCode } from '../../shared/constants/error-codes';

/**
 * Wraps Redis operational requests with comprehensive logging and error boundary mappings.
 */
export class RedisOperations {
  constructor(
    private readonly client: Redis,
    private readonly logger: Logger
  ) {}

  /**
   * Helper executor to map Redis exceptions to InfrastructureError domain wrappers.
   */
  private async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (err: any) {
      this.logger.error(`[RedisOperations] command execution failed: ${err.message}`, { stack: err.stack });
      throw new InfrastructureError(
        `Redis operation failed: ${err.message}`,
        ErrorCode.REDIS_CONNECTION_FAILED,
        { originalError: err.message }
      );
    }
  }

  public async get(key: string): Promise<string | null> {
    return this.execute(() => this.client.get(key));
  }

  public async set(key: string, value: string, ttlMs?: number): Promise<void> {
    await this.execute(async () => {
      if (ttlMs !== undefined && ttlMs > 0) {
        await this.client.set(key, value, 'PX', ttlMs);
      } else {
        await this.client.set(key, value);
      }
    });
  }

  public async setWithExpiry(key: string, value: string, ttlMs: number): Promise<void> {
    await this.set(key, value, ttlMs);
  }

  public async delete(key: string): Promise<boolean> {
    const deletedCount = await this.execute(() => this.client.del(key));
    return deletedCount > 0;
  }

  public async exists(key: string): Promise<boolean> {
    const count = await this.execute(() => this.client.exists(key));
    return count > 0;
  }

  public async ttl(key: string): Promise<number | null> {
    const seconds = await this.execute(() => this.client.ttl(key));
    if (seconds < 0) return null;
    return seconds * 1000; // Return remaining milliseconds
  }

  public async expire(key: string, ttlMs: number): Promise<void> {
    await this.execute(() => this.client.pexpire(key, ttlMs));
  }

  public async increment(key: string, delta = 1): Promise<number> {
    return this.execute(() => this.client.incrby(key, delta));
  }

  public async decrement(key: string, delta = 1): Promise<number> {
    return this.execute(() => this.client.decrby(key, delta));
  }

  public async append(key: string, value: string): Promise<number> {
    return this.execute(() => this.client.append(key, value));
  }

  public async getRange(key: string, start: number, end: number): Promise<string> {
    return this.execute(() => this.client.getrange(key, start, end));
  }

  public async setRange(key: string, offset: number, value: string): Promise<number> {
    return this.execute(() => this.client.setrange(key, offset, value));
  }

  public async lpush(key: string, value: string): Promise<number> {
    return this.execute(() => this.client.lpush(key, value));
  }

  public async rpush(key: string, value: string): Promise<number> {
    return this.execute(() => this.client.rpush(key, value));
  }

  public async lpop(key: string, count?: number): Promise<string[]> {
    return this.execute(async () => {
      if (count !== undefined) {
        const res = await this.client.lpop(key, count);
        return res ? (Array.isArray(res) ? res : [res]) : [];
      } else {
        const res = await this.client.lpop(key);
        return res ? [res] : [];
      }
    });
  }

  public async rpop(key: string, count?: number): Promise<string[]> {
    return this.execute(async () => {
      if (count !== undefined) {
        const res = await this.client.rpop(key, count);
        return res ? (Array.isArray(res) ? res : [res]) : [];
      } else {
        const res = await this.client.rpop(key);
        return res ? [res] : [];
      }
    });
  }

  public async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.execute(() => this.client.lrange(key, start, stop));
  }

  public async llen(key: string): Promise<number> {
    return this.execute(() => this.client.llen(key));
  }

  public async sadd(key: string, values: string[]): Promise<number> {
    if (values.length === 0) return 0;
    return this.execute(() => this.client.sadd(key, ...values));
  }

  public async srem(key: string, values: string[]): Promise<number> {
    if (values.length === 0) return 0;
    return this.execute(() => this.client.srem(key, ...values));
  }

  public async smembers(key: string): Promise<string[]> {
    return this.execute(() => this.client.smembers(key));
  }

  public async scard(key: string): Promise<number> {
    return this.execute(() => this.client.scard(key));
  }

  public async zadd(key: string, score: number, member: string): Promise<void> {
    await this.execute(() => this.client.zadd(key, score, member));
  }

  public async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.execute(() => this.client.zrange(key, start, stop));
  }

  public async zrangebyscore(key: string, min: number, max: number): Promise<string[]> {
    return this.execute(() => this.client.zrangebyscore(key, min, max));
  }

  public async zcard(key: string): Promise<number> {
    return this.execute(() => this.client.zcard(key));
  }

  public async hset(key: string, field: string, value: string): Promise<void> {
    await this.execute(() => this.client.hset(key, field, value));
  }

  public async hget(key: string, field: string): Promise<string | null> {
    return this.execute(() => this.client.hget(key, field));
  }

  public async hgetall(key: string): Promise<Record<string, string>> {
    return this.execute(() => this.client.hgetall(key));
  }

  public async hdel(key: string, field: string): Promise<boolean> {
    const deletedCount = await this.execute(() => this.client.hdel(key, field));
    return deletedCount > 0;
  }

  public async ping(): Promise<void> {
    const response = await this.execute(() => this.client.ping());
    if (response !== 'PONG') {
      throw new Error(`Invalid PING response: ${response}`);
    }
  }

  public async flushdb(): Promise<void> {
    await this.execute(() => this.client.flushdb());
  }

  public async flushall(): Promise<void> {
    await this.execute(() => this.client.flushall());
  }

  public async deleteByPattern(pattern: string): Promise<number> {
    return this.execute(async () => {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        return await this.client.del(...keys);
      }
      return 0;
    });
  }
}
