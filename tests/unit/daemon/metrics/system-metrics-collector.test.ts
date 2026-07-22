import { SystemMetricsCollector } from '../../../../src/daemon/metrics/system-metrics-collector';

describe('SystemMetricsCollector Unit Tests', () => {
  let collector: SystemMetricsCollector;

  beforeEach(() => {
    collector = new SystemMetricsCollector();
  });

  it('should sample process memory, CPU ratio, and uptime metrics', async () => {
    const stats = await collector.collect();
    expect(stats.rss).toBeGreaterThan(0);
    expect(stats.uptime).toBeGreaterThanOrEqual(0);
  });
});
