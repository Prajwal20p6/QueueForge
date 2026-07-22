import client from 'prom-client';

/** Snapshot of metric name → current value mappings. */
export type MetricsSnapshot = Record<string, number>;

/**
 * Provides Prometheus metric inspection utilities for test assertions.
 * Uses the prom-client global registry to read metric values.
 *
 * @example
 * ```typescript
 * const mh = new MetricsTestHelper();
 * const before = mh.getMetricsSnapshot();
 * // ... trigger operation ...
 * mh.assertMetricIncremented('queueforge_deliveries_total', 1);
 * ```
 */
export class MetricsTestHelper {
  private snapshotBefore: MetricsSnapshot = {};

  /**
   * Returns the current value of a named metric, optionally filtered by label set.
   * Returns 0 if the metric is not registered.
   * @param metricName - Prometheus metric name.
   * @param _labels - Optional label filter (not yet used in basic registry lookup).
   */
  public getMetricValue(metricName: string, _labels?: Record<string, string>): number {
    try {
      const metric = client.register.getSingleMetric(metricName);
      if (!metric) return 0;

      // Synchronously get values from the metric
      const values = (metric as unknown as { hashMap: Record<string, { value: number }> }).hashMap;
      if (!values) return 0;

      const entries = Object.values(values);
      if (entries.length === 0) return 0;
      return entries[0]?.value ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * Takes a snapshot of current metric values keyed by metric name.
   */
  public takeSnapshot(): MetricsSnapshot {
    const snapshot: MetricsSnapshot = {};
    const metrics = client.register['_metrics'] as Record<string, { name: string; hashMap?: Record<string, { value: number }> }>;
    for (const [name, metric] of Object.entries(metrics)) {
      const values = metric?.hashMap;
      if (values) {
        const entries = Object.values(values);
        snapshot[name] = entries[0]?.value ?? 0;
      }
    }
    return snapshot;
  }

  /**
   * Returns a full snapshot of all registered metric values.
   */
  public getMetricsSnapshot(): MetricsSnapshot {
    return this.takeSnapshot();
  }

  /**
   * Records the current metric state as a baseline for increment assertions.
   */
  public recordBaseline(): void {
    this.snapshotBefore = this.takeSnapshot();
  }

  /**
   * Asserts that a metric has been incremented by at least the specified amount.
   * Call recordBaseline() before the operation under test.
   * @param metricName - Prometheus metric name.
   * @param expectedIncrement - Minimum expected increment (default: 1).
   */
  public assertMetricIncremented(metricName: string, expectedIncrement = 1): void {
    const before = this.snapshotBefore[metricName] ?? 0;
    const after = this.getMetricValue(metricName);
    const delta = after - before;
    if (delta < expectedIncrement) {
      throw new Error(
        `[MetricsTestHelper] Expected metric "${metricName}" to increment by at least ` +
          `${expectedIncrement} but got ${delta} (before=${before}, after=${after}).`
      );
    }
  }

  /**
   * Asserts that a histogram/counter metric has been recorded at least once.
   * @param metricName - Prometheus metric name.
   * @param bucketValue - Optional expected bucket value to check.
   */
  public assertMetricRecorded(metricName: string, bucketValue?: number): void {
    const value = this.getMetricValue(metricName);
    if (bucketValue !== undefined && value !== bucketValue) {
      throw new Error(
        `[MetricsTestHelper] Expected metric "${metricName}" to equal ` +
          `${bucketValue} but got ${value}.`
      );
    }
    if (bucketValue === undefined && value === 0) {
      throw new Error(
        `[MetricsTestHelper] Expected metric "${metricName}" to have been recorded ` +
          `(non-zero) but got ${value}.`
      );
    }
  }

  /**
   * Clears all metrics from the prom-client global registry.
   */
  public clearMetrics(): void {
    client.register.clear();
    this.snapshotBefore = {};
  }
}
