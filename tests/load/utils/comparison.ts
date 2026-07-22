/**
 * Compares current run statistics against baseline values.
 * Returns true if no regression is detected, false otherwise.
 */
export function compareMetrics(current: { p95: number }, baseline: { p95: number }) {
  const p95Change = ((current.p95 - baseline.p95) / baseline.p95) * 100;
  const isRegression = p95Change > 10; // Regression if P95 slows down by >10%
  const isImprovement = p95Change < -5; // Improvement if P95 speeds up by >5%

  return {
    p95ChangePercent: p95Change,
    isRegression,
    isImprovement,
    summary: `Current P95: ${current.p95}ms, Baseline P95: ${baseline.p95}ms. Change: ${p95Change.toFixed(2)}%. Status: ${
      isRegression ? 'REGRESSION' : isImprovement ? 'IMPROVEMENT' : 'STABLE'
    }`,
  };
}
