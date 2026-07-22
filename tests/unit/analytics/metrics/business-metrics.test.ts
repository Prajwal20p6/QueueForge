import { BusinessMetricsCalculator } from '../../../../src/analytics/metrics/business-metrics';

describe('BusinessMetricsCalculator Unit Tests', () => {
  it('should compile business KPIs aggregates correctly', async () => {
    const calculator = new BusinessMetricsCalculator();
    const metrics = await calculator.calculateMetrics();

    expect(metrics.totalProcessed).toBe(14500);
    expect(metrics.successRate).toBe(99.95);
    expect(metrics.costEstimate).toBeGreaterThan(0);
  });
});
