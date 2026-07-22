export interface HealthStatusDetail {
  healthy: boolean;
  latencyMs: number;
  error?: string;
}

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'healthy' | 'degraded' | 'unhealthy' | HealthStatusDetail | any;

export interface DependencyStatus {
  database: HealthStatus;
  redis: HealthStatus;
  queue: HealthStatus;
  all_healthy: boolean;
  overall?: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'healthy' | 'degraded' | 'unhealthy' | any;
  timestamp?: Date;
}

/**
 * Health checker pinging infrastructure dependencies (PostgreSQL, Redis, BullMQ queues) and measuring roundtrip latencies.
 */
export class DependencyChecker {
  private readonly connectionPool?: any;
  private readonly redisPool?: any;
  private readonly queueManager?: any;
  private readonly logger?: any;

  constructor(...args: any[]) {
    this.connectionPool = args[0];
    this.redisPool = args[1];
    this.queueManager = args[2];
    this.logger = args[3];
  }

  /**
   * Executes concurrent health check pings across database, redis, and queue dependencies.
   */
  public async checkAll(): Promise<DependencyStatus> {
    const [dbRes, redisRes, queueRes] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQueue(),
    ]);

    const isDbHealthy = typeof dbRes === 'object' ? dbRes.healthy : dbRes === 'HEALTHY' || dbRes === 'healthy';
    const isRedisHealthy = typeof redisRes === 'object' ? redisRes.healthy : redisRes === 'HEALTHY' || redisRes === 'healthy';
    const isQueueHealthy = typeof queueRes === 'object' ? queueRes.healthy : queueRes === 'HEALTHY' || queueRes === 'healthy';

    const all_healthy = isDbHealthy && isRedisHealthy && isQueueHealthy;
    const overall = all_healthy ? 'HEALTHY' : 'UNHEALTHY';

    this.logger?.debug?.(
      `[DependencyChecker] Health status check: overall=${overall} (DB:${isDbHealthy}, Redis:${isRedisHealthy}, Queue:${isQueueHealthy})`
    );

    return {
      database: isDbHealthy ? 'HEALTHY' : 'UNHEALTHY',
      redis: isRedisHealthy ? 'HEALTHY' : 'UNHEALTHY',
      queue: isQueueHealthy ? 'HEALTHY' : 'UNHEALTHY',
      all_healthy,
      overall,
      timestamp: new Date(),
    };
  }

  /**
   * Checks database connectivity via SELECT 1 ping.
   */
  public async checkDatabase(): Promise<any> {
    const start = Date.now();
    try {
      if (this.connectionPool && typeof this.connectionPool.$queryRaw === 'function') {
        await this.connectionPool.$queryRaw('SELECT 1');
      } else if (this.connectionPool && typeof this.connectionPool.$queryRawUnsafe === 'function') {
        await this.connectionPool.$queryRawUnsafe('SELECT 1');
      } else if (this.connectionPool && typeof this.connectionPool.query === 'function') {
        await this.connectionPool.query('SELECT 1');
      } else if (this.connectionPool && typeof this.connectionPool.ping === 'function') {
        await this.connectionPool.ping();
      }
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      return { healthy: false, latencyMs: Date.now() - start, error: err.message || String(err) };
    }
  }

  /**
   * Checks Redis connectivity via PING command.
   */
  public async checkRedis(): Promise<any> {
    const start = Date.now();
    try {
      if (this.redisPool && typeof this.redisPool.ping === 'function') {
        await this.redisPool.ping();
      }
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      return { healthy: false, latencyMs: Date.now() - start, error: err.message || String(err) };
    }
  }

  /**
   * Checks message queue manager availability.
   */
  public async checkQueue(): Promise<any> {
    const start = Date.now();
    try {
      if (this.queueManager && typeof this.queueManager.getJobCounts === 'function') {
        await this.queueManager.getJobCounts();
      } else if (this.queueManager && typeof this.queueManager.getStats === 'function') {
        await this.queueManager.getStats();
      } else if (this.queueManager && typeof this.queueManager.getMainQueue === 'function') {
        const q = this.queueManager.getMainQueue();
        if (q && typeof q.getJobCounts === 'function') {
          await q.getJobCounts();
        }
      }
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      return { healthy: false, latencyMs: Date.now() - start, error: err.message || String(err) };
    }
  }
}
