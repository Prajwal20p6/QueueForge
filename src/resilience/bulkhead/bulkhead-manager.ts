import { Bulkhead, BulkheadConfig } from './bulkhead';
import { BulkheadStats } from './bulkhead-metrics';

/**
 * Registry and lifecycle manager isolating resources via named Bulkhead instances.
 */
export class BulkheadManager {
  private readonly bulkheads: Map<string, Bulkhead> = new Map();

  constructor(
    private readonly config?: any,
    private readonly logger?: any,
    _metricsRegistry?: any
  ) {
    // Initialize standard category bulkheads on construction
    this.createBulkhead('WEBHOOK', 20, 100);
    this.createBulkhead('DATABASE', 50, 200);
    this.createBulkhead('QUEUE', 30, 150);
    this.createBulkhead('AUDIT', 10, 50);
  }

  public getBulkhead(name: string): Bulkhead {
    let bulkhead = this.bulkheads.get(name);
    if (!bulkhead) {
      bulkhead = this.createBulkhead(name);
    }
    return bulkhead;
  }

  public async acquire(name: string, timeoutMs?: number): Promise<string> {
    const bulkhead = this.getBulkhead(name);
    await bulkhead.pool.acquire(timeoutMs || bulkhead.config.timeout, name);
    return `${name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }

  public release(name: string, _ticketId?: string): void {
    const bulkhead = this.getBulkhead(name);
    bulkhead.pool.release();
  }

  public createBulkhead(
    name: string,
    maxConcurrent?: number,
    maxQueueSize?: number,
    overrideConfig?: Partial<BulkheadConfig>
  ): Bulkhead {
    const config: Partial<BulkheadConfig> = {
      maxConcurrent: maxConcurrent ?? this.config?.bulkhead?.maxConcurrent ?? 20,
      maxQueueSize: maxQueueSize ?? this.config?.bulkhead?.maxQueueSize ?? 100,
      timeout: this.config?.bulkhead?.timeout ?? 30000,
      ...overrideConfig,
    };

    const bulkhead = new Bulkhead(name, config, this.logger);
    this.bulkheads.set(name, bulkhead);
    this.logger?.debug?.(`[BulkheadManager] Registered Bulkhead "${name}" (maxConcurrent=${config.maxConcurrent})`);
    return bulkhead;
  }

  public getAll(): Bulkhead[] {
    return Array.from(this.bulkheads.values());
  }

  public getStats(): Map<string, BulkheadStats> {
    const statsMap = new Map<string, BulkheadStats>();
    for (const [name, bulkhead] of this.bulkheads.entries()) {
      statsMap.set(name, bulkhead.getStats());
    }
    return statsMap;
  }
}
