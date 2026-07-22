/**
 * @fileoverview Memory Profiling Tool
 * Measures memory footprint across steady state, under high load, and checks for memory leaks over time.
 */

export class MemoryProfiler {
  public getMemoryUsage() {
    const mem = process.memoryUsage();
    return {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      externalMb: Math.round(mem.external / 1024 / 1024),
    };
  }

  public detectMemoryLeak(samplesMb: number[], thresholdGrowthPercent = 50): boolean {
    if (samplesMb.length < 3) return false;
    const initial = samplesMb[0];
    const final = samplesMb[samplesMb.length - 1];
    const growth = ((final - initial) / initial) * 100;
    return growth > thresholdGrowthPercent;
  }
}

describe('Memory Profiling Tests', () => {
  const profiler = new MemoryProfiler();

  it('should capture current process memory usage profile', () => {
    const usage = profiler.getMemoryUsage();
    expect(usage.heapUsedMb).toBeGreaterThan(0);
    expect(usage.rssMb).toBeGreaterThan(0);
  });

  it('should verify stable memory usage without leaks across sample intervals', () => {
    const memorySamples = [120, 122, 121, 123, 122]; // Stable memory in MB
    const hasLeak = profiler.detectMemoryLeak(memorySamples);
    expect(hasLeak).toBe(false);
  });
});
