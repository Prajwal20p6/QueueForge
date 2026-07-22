/**
 * Performance diagnostic profiling latencies percentiles metrics.
 */
export class PerformanceAnalyzer {
  /**
   * Asserts latencies lists compiling average latency percentiles.
   */
  public analyze(latenciesMs: number[]) {
    if (latenciesMs.length === 0) return { p50: 0, p95: 0, recommendations: [] };
    const sorted = [...latenciesMs].sort((a, b) => a - b);
    const p95Val = sorted[Math.ceil(sorted.length * 0.95) - 1] || 0;

    const recommendations = [];
    if (p95Val > 3500) {
      recommendations.push('Ingestion latency P95 exceeds SLO. Scale up worker nodes allocations.');
    }

    return {
      p50: sorted[Math.ceil(sorted.length * 0.5) - 1] || 0,
      p95: p95Val,
      recommendations,
    };
  }
}
