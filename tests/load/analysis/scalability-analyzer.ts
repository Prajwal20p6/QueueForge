/**
 * Scalability Analyzer Class
 * Maps throughput curves ratio growth limits.
 */
export class ScalabilityAnalyzer {
  public evaluateScalability(concurrencySteps: number[], latencySteps: number[]): 'linear' | 'sub-linear' | 'degraded' {
    if (concurrencySteps.length < 2) {
      return 'linear';
    }

    const firstLatency = latencySteps[0] ?? 1;
    const lastLatency = latencySteps[latencySteps.length - 1] ?? 1;
    const firstConcurrency = concurrencySteps[0] ?? 1;
    const lastConcurrency = concurrencySteps[concurrencySteps.length - 1] ?? 1;

    const latencyGrowth = lastLatency / firstLatency;
    const loadGrowth = lastConcurrency / firstConcurrency;

    if (latencyGrowth > loadGrowth) {
      return 'degraded';
    }
    return 'sub-linear';
  }
}
