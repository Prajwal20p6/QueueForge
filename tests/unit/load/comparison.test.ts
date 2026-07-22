import { compareMetrics } from '../../load/utils/comparison';

describe('comparison Unit Tests', () => {
  it('should flag regression if P95 latency increases by more than 10%', () => {
    const current = { p95: 120 };
    const baseline = { p95: 100 };
    const res = compareMetrics(current, baseline);

    expect(res.isRegression).toBe(true);
    expect(res.p95ChangePercent).toBe(20);
  });

  it('should flag improvement if P95 latency decreases by more than 5%', () => {
    const current = { p95: 90 };
    const baseline = { p95: 100 };
    const res = compareMetrics(current, baseline);

    expect(res.isImprovement).toBe(true);
    expect(res.isRegression).toBe(false);
  });
});
