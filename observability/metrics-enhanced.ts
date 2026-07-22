import { MetricsRegistry } from '../src/observability/metrics/metrics-registry';

/**
 * Enhanced metrics registry recording multidimensional parameters histograms.
 */
export class EnhancedMetricsRegistry {
  private readonly baseRegistry: MetricsRegistry;

  constructor(baseRegistry: MetricsRegistry) {
    this.baseRegistry = baseRegistry;
  }

  /**
   * Logs execution delays specifying status outcomes.
   */
  public recordLatencyWithContext(
    metricName: string,
    latencyMs: number,
    tags: { status: string; type: string }
  ): void {
    const meter = this.baseRegistry.getMeter();
    if (meter) {
      const histogram = meter.createHistogram(metricName);
      histogram.record(latencyMs, tags);
    }
  }
}
