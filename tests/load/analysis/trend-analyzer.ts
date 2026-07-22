/**
 * Trend Analyzer Class
 * Compares current run against historical baselines list.
 */
export class TrendAnalyzer {
  public checkTrends(currentP95: number, history: any[]): { isDegrading: boolean } {
    if (history.length === 0) {
      return { isDegrading: false };
    }

    // Compare against first record (baseline inception)
    const baselineP95 = history[0].metrics.ramp.p95;
    const isDegrading = currentP95 > baselineP95 * 1.15; // >15% degradation

    return { isDegrading };
  }
}
