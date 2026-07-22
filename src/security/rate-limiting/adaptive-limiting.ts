/**
 * Dynamically adjusts rate limit thresholds based on cpu/memory metrics.
 */
export class AdaptiveLimiter {
  /**
   * Adapts standard rate limits values.
   */
  public getAdaptiveLimit(baseLimit: number, currentCpuLoadPercent: number): number {
    if (currentCpuLoadPercent > 85.0) {
      return Math.floor(baseLimit * 0.5); // Halve the limit under stress
    }
    if (currentCpuLoadPercent > 70.0) {
      return Math.floor(baseLimit * 0.8); // Reduce by 20%
    }
    return baseLimit;
  }
}
