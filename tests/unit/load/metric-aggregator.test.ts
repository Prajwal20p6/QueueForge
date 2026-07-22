import { aggregateMetrics } from '../../load/utils/metric-aggregator';

describe('metric-aggregator Unit Tests', () => {
  it('should calculate correct percentiles from sorting mock list', () => {
    const latencies = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const metrics = aggregateMetrics(latencies, 0, 10, 1);

    expect(metrics.p50).toBe(50);
    expect(metrics.p95).toBe(100);
    expect(metrics.p99).toBe(100);
    expect(metrics.errorRate).toBe(0);
    expect(metrics.rps).toBe(10);
  });
});
