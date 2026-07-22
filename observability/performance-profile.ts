/**
 * Performance Analyzer class profiling latency percentiles.
 */
export class PerformanceProfile {
  /**
   * Builds summary properties of latencies list.
   */
  public compile(latenciesMs: number[]): { p50: number; p95: number; p99: number } {
    if (latenciesMs.length === 0) return { p50: 0, p95: 0, p99: 0 };
    const sorted = [...latenciesMs].sort((a, b) => a - b);
    const getPct = (p: number) => {
      const idx = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[idx] || 0;
    };

    return {
      p50: getPct(50),
      p95: getPct(95),
      p99: getPct(99),
    };
  }
}
