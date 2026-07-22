/**
 * Metrics verification assertion helper.
 */
export class MetricAssertions {
  public static assertCounterIncremented(mockMetric: any, expectedMin = 1): void {
    const addCalls = mockMetric?.add?.mock?.calls?.length || mockMetric?.increment?.mock?.calls?.length || 0;
    if (addCalls < expectedMin) {
      throw new Error(`Expected counter metric to be incremented at least ${expectedMin} times, got ${addCalls}`);
    }
  }
}
