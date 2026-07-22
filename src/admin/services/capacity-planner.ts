/**
 * Planner class predicting system resource saturation metrics.
 */
export class CapacityPlanner {
  /**
   * Forecasts memory or storage capacities saturation timelines.
   */
  public projectGrowth(currentBytes: number, monthlyRatePercent: number, monthsCount = 6): number {
    let projected = currentBytes;
    for (let i = 0; i < monthsCount; i++) {
      projected += projected * (monthlyRatePercent / 100);
    }
    return projected;
  }
}
