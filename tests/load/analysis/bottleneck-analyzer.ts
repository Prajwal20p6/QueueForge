/**
 * Bottleneck Analyzer Class
 * Correlates latency spikes with hardware resource constraints.
 */
export class BottleneckAnalyzer {
  public findBottleneck(latencyMs: number, cpuUsage: number): string | null {
    if (latencyMs > 2000 && cpuUsage > 0.85) {
      return 'CPU_SATURATION';
    }
    if (latencyMs > 5000) {
      return 'NETWORK_TIMEOUT';
    }
    return null;
  }
}
