import { RedisOperations } from '../../infrastructure/redis/redis-operations';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

export interface QuotaDefinition {
  name: string;
  limit: number;
  window?: string;
  scope?: string;
}

export interface QuotaUsage {
  apiKeyId: string;
  period: 'hour' | 'day' | 'month';
  usage: number;
  limit: number;
  remaining: number;
  resetAt: Date;
}

export const QUOTA_TIERS: Record<string, { hourlyLimit: number; dailyLimit: number }> = {
  FREE: { hourlyLimit: 100, dailyLimit: 1000 },
  PRO: { hourlyLimit: 10000, dailyLimit: 100000 },
  ENTERPRISE: { hourlyLimit: Infinity, dailyLimit: Infinity },
};

/**
 * Service tracking API key usage quotas across hourly/daily/monthly billing tiers.
 */
export class QuotaTracker {
  private readonly memoryUsage = new Map<string, number>();
  private readonly definitionsMap = new Map<string, number>();
  private readonly logger?: Logger | any;

  constructor(
    private readonly redisOps?: RedisOperations | any,
    definitionsOrLogger?: QuotaDefinition[] | Logger | any
  ) {
    if (Array.isArray(definitionsOrLogger)) {
      definitionsOrLogger.forEach(def => {
        if (def && def.name && typeof def.limit === 'number') {
          this.definitionsMap.set(def.name, def.limit);
        }
      });
    } else {
      this.logger = definitionsOrLogger;
    }
  }

  private getQuotaKey(apiKeyId: string, period: string): string {
    const dateStr = new Date().toISOString().slice(0, period === 'hour' ? 13 : period === 'day' ? 10 : 7);
    return `queueforge:quota:${apiKeyId}:${period}:${dateStr}`;
  }

  /**
   * Increments usage counters for a specified operation and API key ID.
   */
  public async trackUsage(apiKeyId: string, _operation: string = 'ingest', count: number = 1): Promise<void> {
    if (!apiKeyId) return;

    for (const period of ['hour', 'day', 'month']) {
      const key = this.getQuotaKey(apiKeyId, period);
      this.memoryUsage.set(key, (this.memoryUsage.get(key) || 0) + count);

      if (this.redisOps && typeof this.redisOps.incrby === 'function') {
        try {
          await this.redisOps.incrby(key, count);
        } catch {
          // ignore
        }
      }
    }
  }

  public async updateUsage(apiKeyId: string, operation: string = 'ingest', count: number = 1): Promise<void> {
    await this.trackUsage(apiKeyId, operation, count);
  }

  /**
   * Asserts whether an API key has remaining quota volume under its current tier.
   */
  public async checkQuota(
    apiKeyId: string,
    tierOrOperation: string = 'FREE',
    operationParam: string = 'ingest',
    _count: number = 1
  ): Promise<{ allowed: boolean; remaining: number }> {
    let limit = 100;
    if (this.definitionsMap.has(tierOrOperation)) {
      limit = this.definitionsMap.get(tierOrOperation)!;
    } else if (this.definitionsMap.has(operationParam)) {
      limit = this.definitionsMap.get(operationParam)!;
    } else {
      const tierConfig = QUOTA_TIERS[tierOrOperation.toUpperCase()] || QUOTA_TIERS.FREE;
      limit = tierConfig.hourlyLimit;
    }

    if (limit === Infinity) {
      return { allowed: true, remaining: Infinity };
    }

    const currentUsage = await this.getCurrentCount(apiKeyId, 'hour');
    const remaining = Math.max(0, limit - currentUsage);
    const allowed = currentUsage < limit;

    if (!allowed) {
      this.logger?.warn?.(`Quota limit exceeded for API Key "${apiKeyId}". Usage: ${currentUsage}/${limit}`);
    }

    return { allowed, remaining };
  }

  private async getCurrentCount(apiKeyId: string, period: 'hour' | 'day' | 'month'): Promise<number> {
    const key = this.getQuotaKey(apiKeyId, period);
    if (this.redisOps && typeof this.redisOps.get === 'function') {
      try {
        const val = await this.redisOps.get(key);
        if (val !== null && val !== undefined) {
          return parseInt(String(val), 10) || 0;
        }
      } catch {
        // Fall back to memory
      }
    }
    return this.memoryUsage.get(key) || 0;
  }

  /**
   * Retrieves usage summary details for an API key.
   */
  public async getUsage(apiKeyId: string, period: 'hour' | 'day' | 'month' = 'hour', tier = 'FREE'): Promise<QuotaUsage> {
    const tierConfig = QUOTA_TIERS[tier.toUpperCase()] || QUOTA_TIERS.FREE;
    const limit = period === 'hour' ? tierConfig.hourlyLimit : tierConfig.dailyLimit;
    const usage = await this.getCurrentCount(apiKeyId, period);

    const now = new Date();
    const resetAt = new Date(now);
    if (period === 'hour') resetAt.setHours(resetAt.getHours() + 1, 0, 0, 0);
    else if (period === 'day') resetAt.setDate(resetAt.getDate() + 1);

    return {
      apiKeyId,
      period,
      usage,
      limit,
      remaining: Math.max(0, limit - usage),
      resetAt,
    };
  }

  /**
   * Resets quota tracking counters for an API key.
   */
  public async resetQuota(apiKeyId: string): Promise<void> {
    for (const period of ['hour', 'day', 'month']) {
      const key = this.getQuotaKey(apiKeyId, period);
      this.memoryUsage.delete(key);
      if (this.redisOps && typeof this.redisOps.delete === 'function') {
        try {
          await this.redisOps.delete(key);
        } catch {
          // ignore
        }
      }
    }
  }
}
