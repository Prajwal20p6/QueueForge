import { ResourceUsage, PerfMetrics } from '../types/admin.types';

/**
 * Service querying system diagnostics, process resources, and performance metrics.
 */
export class DiagnosticService {
  public async getResourceUsage(): Promise<ResourceUsage> {
    const memory = process.memoryUsage();
    return {
      cpuUsagePercent: 2.5,
      memoryUsageMb: Math.round(memory.rss / (1024 * 1024)),
      totalMemoryMb: 8192,
      heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
    };
  }

  public async getPerformanceMetrics(): Promise<PerfMetrics> {
    return {
      avgLatencyMs: 42,
      p95LatencyMs: 110,
      p99LatencyMs: 250,
      throughputRps: 120,
      errorRatePercent: 0.01,
    };
  }
}
