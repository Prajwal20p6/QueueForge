/**
 * Aggregates arrays of latency numbers into standard percentile metrics.
 */
export function aggregateMetrics(
  latencies: number[],
  errorCount: number,
  totalRequests: number,
  durationSec: number
) {
  if (!latencies || latencies.length === 0) {
    return { p50: 0, p95: 0, p99: 0, errorRate: 0, rps: 0 };
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const getPercentile = (p: number) => {
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[idx] || 0;
  };

  return {
    p50: getPercentile(50),
    p95: getPercentile(95),
    p99: getPercentile(99),
    errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
    rps: durationSec > 0 ? totalRequests / durationSec : 0,
  };
}
