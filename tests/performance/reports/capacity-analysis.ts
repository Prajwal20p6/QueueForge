/**
 * @fileoverview Capacity Headroom Analysis Generator
 * Calculates capacity headroom for throughput, latency, memory, and database connection pools with scaling recommendations.
 */

export interface CapacityHeadroom {
  throughputHeadroomPercent: number;
  latencyHeadroomPercent: number;
  memoryHeadroomPercent: number;
  recommendations: string[];
}

export class CapacityAnalyzer {
  public analyzeHeadroom(currentLoad: {
    opsPerSec: number;
    maxOpsPerSec: number;
    p95LatencyMs: number;
    sloLatencyMs: number;
    usedMemoryMb: number;
    maxMemoryMb: number;
  }): CapacityHeadroom {
    const throughputHeadroomPercent = Number(
      (((currentLoad.maxOpsPerSec - currentLoad.opsPerSec) / currentLoad.maxOpsPerSec) * 100).toFixed(2),
    );
    const latencyHeadroomPercent = Number(
      (((currentLoad.sloLatencyMs - currentLoad.p95LatencyMs) / currentLoad.sloLatencyMs) * 100).toFixed(2),
    );
    const memoryHeadroomPercent = Number(
      (((currentLoad.maxMemoryMb - currentLoad.usedMemoryMb) / currentLoad.maxMemoryMb) * 100).toFixed(2),
    );

    const recommendations: string[] = [];
    if (throughputHeadroomPercent < 30) {
      recommendations.push('Scale worker replica count to maintain >30% throughput headroom.');
    }
    if (memoryHeadroomPercent < 25) {
      recommendations.push('Increase Kubernetes container memory limits.');
    }

    return {
      throughputHeadroomPercent,
      latencyHeadroomPercent,
      memoryHeadroomPercent,
      recommendations,
    };
  }
}

describe('Capacity Analysis Tests', () => {
  const analyzer = new CapacityAnalyzer();

  it('should calculate capacity headroom metrics and produce actionable scaling recommendations', () => {
    const analysis = analyzer.analyzeHeadroom({
      opsPerSec: 1500,
      maxOpsPerSec: 3000,
      p95LatencyMs: 800,
      sloLatencyMs: 5000,
      usedMemoryMb: 350,
      maxMemoryMb: 1024,
    });

    expect(analysis.throughputHeadroomPercent).toBe(50);
    expect(analysis.latencyHeadroomPercent).toBe(84);
    expect(analysis.memoryHeadroomPercent).toBe(65.82);
  });
});
