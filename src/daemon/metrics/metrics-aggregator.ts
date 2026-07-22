export interface AggregationResult {
  collected: number;
  failed: number;
  duration: number; // in milliseconds
}

/**
 * Aggregator orchestrating metrics collection runs across registered collectors.
 */
export class MetricsAggregator {
  private readonly collectors = new Map<string, any>();

  constructor(
    initialCollectors: any[] = [],
    _metricsRegistry?: any,
    private readonly logger?: any
  ) {
    for (const c of initialCollectors) {
      this.registerCollector(c);
    }
  }

  /**
   * Registers a typed metrics collector engine.
   */
  public registerCollector(collector: any): void {
    const name = collector?.name || `Collector-${this.collectors.size + 1}`;
    this.collectors.set(name, collector);
    this.logger?.debug?.(`[MetricsAggregator] Registered collector "${name}"`);
  }

  /**
   * Unregisters a metrics collector engine by name.
   */
  public unregisterCollector(name: string): void {
    this.collectors.delete(name);
    this.logger?.debug?.(`[MetricsAggregator] Unregistered collector "${name}"`);
  }

  /**
   * Executes collection across all registered collectors in parallel.
   */
  public async aggregate(): Promise<AggregationResult> {
    const start = Date.now();
    let collected = 0;
    let failed = 0;

    const list = Array.from(this.collectors.values());
    await Promise.all(
      list.map(async collector => {
        try {
          if (typeof collector.collect === 'function') {
            await collector.collect();
            collected++;
          }
        } catch (err: any) {
          failed++;
          this.logger?.error?.(`[MetricsAggregator] Collector "${collector?.name || 'unknown'}" failed: ${err.message}`);
        }
      })
    );

    const duration = Date.now() - start;
    this.logger?.debug?.(`[MetricsAggregator] Metrics aggregation complete (collected: ${collected}, failed: ${failed}, duration: ${duration}ms)`);

    return {
      collected,
      failed,
      duration,
    };
  }
}
