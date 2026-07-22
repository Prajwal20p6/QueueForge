/**
 * Simple statistical linear regressions trend evaluator.
 */
export class TrendAnalyzer {
  /**
   * Evaluates if dataset metrics values are degrading (growing) or stable.
   */
  public analyzeTrend(values: number[]): 'degrading' | 'improving' | 'stable' {
    if (values.length < 2) return 'stable';

    const first = values[0];
    const last = values[values.length - 1];

    const pctDiff = ((last - first) / first) * 100;
    if (pctDiff > 10.0) return 'degrading'; // Slowing down / growing resource usage
    if (pctDiff < -5.0) return 'improving';
    return 'stable';
  }
}
