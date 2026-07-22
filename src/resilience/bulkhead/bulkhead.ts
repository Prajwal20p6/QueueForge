import { ResourcePool } from './resource-pool';
import { BulkheadMetrics, BulkheadStats } from './bulkhead-metrics';
import { BulkheadFullError } from '../errors/bulkhead-full-error';

export interface BulkheadConfig {
  maxConcurrent: number;
  maxQueueSize: number;
  timeout?: number;
}

/**
 * Bulkhead isolation pattern barrier limiting maximum concurrent operations and queue depth per downstream category.
 */
export class Bulkhead {
  public readonly name: string;
  public readonly config: BulkheadConfig;
  public readonly pool: ResourcePool;
  public readonly metrics: BulkheadMetrics;

  constructor(
    name: string,
    config: Partial<BulkheadConfig> = {},
    private readonly logger?: any
  ) {
    this.name = name;
    this.config = {
      maxConcurrent: config.maxConcurrent || 10,
      maxQueueSize: config.maxQueueSize || 50,
      timeout: config.timeout || 30000,
    };
    this.pool = new ResourcePool(this.config.maxConcurrent, logger);
    this.metrics = new BulkheadMetrics(this.config.maxConcurrent);
  }

  public isFull(): boolean {
    const stats = this.pool.getStats();
    return stats.inUse >= this.config.maxConcurrent && stats.queued >= this.config.maxQueueSize;
  }

  public getStats(): BulkheadStats {
    const poolStats = this.pool.getStats();
    const metrics = this.metrics.getMetrics();
    return {
      ...metrics,
      active: poolStats.inUse,
      queued: poolStats.queued,
      total: this.config.maxConcurrent,
    };
  }

  /**
   * Executes an asynchronous task inside the concurrency-isolated Bulkhead.
   */
  public async execute<T>(fn: () => Promise<T>, overrideTimeoutMs?: number): Promise<T> {
    const poolStats = this.pool.getStats();
    if (poolStats.inUse >= this.config.maxConcurrent && poolStats.queued >= this.config.maxQueueSize) {
      this.metrics.recordRejection();
      this.logger?.warn?.(`[Bulkhead:${this.name}] Execution rejected - Pool and Queue full`);
      throw new BulkheadFullError(this.name);
    }

    const timeoutMs = overrideTimeoutMs ?? this.config.timeout ?? 30000;
    this.metrics.recordQueued();

    let acquired = false;
    try {
      acquired = await this.pool.tryAcquire(timeoutMs, this.name);
    } finally {
      this.metrics.recordDequeued();
    }

    if (!acquired) {
      this.metrics.recordRejection();
      throw new BulkheadFullError(this.name);
    }

    this.metrics.recordAcquire();

    try {
      return await fn();
    } finally {
      this.pool.release();
      this.metrics.recordRelease();
    }
  }

  public reset(): void {
    this.metrics.reset();
  }
}
