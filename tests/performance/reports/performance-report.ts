/**
 * @fileoverview Performance Report Generator
 * Aggregates benchmarks, load test metrics, throughput stats, and resource utilization into Markdown and JSON reports.
 */

export interface PerformanceSummary {
  throughputOpsSec: number;
  latencyP50Ms: number;
  latencyP95Ms: number;
  latencyP99Ms: number;
  errorRatePercent: number;
  peakMemoryMb: number;
  cpuUtilPercent: number;
}

export class PerformanceReportGenerator {
  public generateMarkdownReport(summary: PerformanceSummary): string {
    return `# QueueForge Performance & Benchmark Report

## Summary Metrics
- **Throughput**: ${summary.throughputOpsSec} ops/sec
- **Latency P50**: ${summary.latencyP50Ms} ms
- **Latency P95**: ${summary.latencyP95Ms} ms
- **Latency P99**: ${summary.latencyP99Ms} ms
- **Error Rate**: ${summary.errorRatePercent}%
- **Peak Memory**: ${summary.peakMemoryMb} MB
- **CPU Utilization**: ${summary.cpuUtilPercent}%
`;
  }
}

describe('Performance Report Generator Tests', () => {
  const generator = new PerformanceReportGenerator();

  it('should generate formatted Markdown performance report', () => {
    const summary: PerformanceSummary = {
      throughputOpsSec: 2850,
      latencyP50Ms: 120,
      latencyP95Ms: 450,
      latencyP99Ms: 1100,
      errorRatePercent: 0.01,
      peakMemoryMb: 340,
      cpuUtilPercent: 42,
    };

    const report = generator.generateMarkdownReport(summary);
    expect(report).toContain('QueueForge Performance & Benchmark Report');
    expect(report).toContain('2850 ops/sec');
    expect(report).toContain('450 ms');
  });
});
