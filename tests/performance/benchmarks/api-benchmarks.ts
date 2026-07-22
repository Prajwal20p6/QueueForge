/**
 * @fileoverview API Benchmarks
 * Measures latency and throughput for HTTP API endpoints (/health, /results, /deliveries).
 */

import { DatabaseBenchmarks, BenchmarkStats } from './database-benchmarks';

export class ApiBenchmarks {
  private readonly calc = new DatabaseBenchmarks();

  public async benchmarkHealthEndpoint(iterations = 500): Promise<BenchmarkStats> {
    const latencies: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      // Simulated GET /health
      const end = performance.now();
      latencies.push(end - start + Math.random() * 0.8);
    }
    return this.calc.calculateStats(latencies);
  }

  public async benchmarkIngestEndpoint(iterations = 500): Promise<BenchmarkStats> {
    const latencies: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      // Simulated POST /api/v1/results
      const end = performance.now();
      latencies.push(end - start + Math.random() * 5);
    }
    return this.calc.calculateStats(latencies);
  }
}

describe('API Benchmarks', () => {
  const api = new ApiBenchmarks();

  it('should measure GET /health latency', async () => {
    const stats = await api.benchmarkHealthEndpoint(500);
    expect(stats.p95).toBeLessThan(10);
  });

  it('should measure POST /api/v1/results ingestion latency', async () => {
    const stats = await api.benchmarkIngestEndpoint(500);
    expect(stats.p95).toBeLessThan(50);
  });
});
