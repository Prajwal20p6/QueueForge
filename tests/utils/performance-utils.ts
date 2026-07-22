/**
 * Lightweight performance monitor for tracking operation durations during tests.
 * Useful for asserting that critical code paths meet latency thresholds.
 *
 * @example
 * ```typescript
 * const perf = new PerformanceMonitor();
 * perf.start('delivery-pipeline');
 * await runPipeline();
 * const ms = perf.end('delivery-pipeline');
 * expect(ms).toBeLessThan(500);
 * ```
 */
export class PerformanceMonitor {
  private readonly starts: Map<string, number> = new Map();
  private readonly durations: Map<string, number> = new Map();

  /**
   * Marks the start time for a labelled operation.
   * @param label - Unique identifier for the operation.
   */
  public start(label: string): void {
    this.starts.set(label, Date.now());
  }

  /**
   * Marks the end time and returns the duration in milliseconds.
   * @param label - Label matching a previous start() call.
   * @throws {Error} if start() was not called for the label.
   */
  public end(label: string): number {
    const startTime = this.starts.get(label);
    if (startTime === undefined) {
      throw new Error(
        `[PerformanceMonitor] No start time recorded for label "${label}". Call start() first.`
      );
    }
    const duration = Date.now() - startTime;
    this.durations.set(label, duration);
    this.starts.delete(label);
    return duration;
  }

  /**
   * Returns a report of all completed label-duration pairs.
   */
  public report(): Record<string, number> {
    return Object.fromEntries(this.durations.entries());
  }

  /**
   * Returns the top N slowest operations from the report.
   * @param n - Number of results to return (default: 5).
   */
  public slowest(n = 5): Array<{ label: string; durationMs: number }> {
    return Array.from(this.durations.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, n)
      .map(([label, durationMs]) => ({ label, durationMs }));
  }

  /**
   * Asserts that the named operation completed within a threshold.
   * @param label - Operation label.
   * @param thresholdMs - Maximum allowed duration in milliseconds.
   */
  public assertUnder(label: string, thresholdMs: number): void {
    const duration = this.durations.get(label);
    if (duration === undefined) {
      throw new Error(
        `[PerformanceMonitor] No completed timing found for label "${label}". Call end() first.`
      );
    }
    if (duration > thresholdMs) {
      throw new Error(
        `[PerformanceMonitor] "${label}" took ${duration}ms which exceeds threshold of ${thresholdMs}ms.`
      );
    }
  }

  /**
   * Resets all timings.
   */
  public reset(): void {
    this.starts.clear();
    this.durations.clear();
  }
}
