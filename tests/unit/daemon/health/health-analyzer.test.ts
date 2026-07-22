import { HealthAnalyzer } from '../../../../src/daemon/health/health-analyzer';

describe('HealthAnalyzer Unit Tests', () => {
  let analyzer: HealthAnalyzer;

  beforeEach(() => {
    analyzer = new HealthAnalyzer();
  });

  it('should calculate composite score 100 and HEALTHY severity when all dependencies healthy', () => {
    const checks: any = {
      database: { healthy: true, latencyMs: 10 },
      redis: { healthy: true, latencyMs: 5 },
      queue: { healthy: true, latencyMs: 8 },
      all_healthy: true,
    };

    const result = analyzer.analyze(checks);
    expect(result.score).toBe(100);
    expect(result.severity).toBe('healthy');
  });

  it('should penalize latency and degrade status if 1 check fails or is slow', () => {
    const checks: any = {
      database: { healthy: false, latencyMs: 100 },
      redis: { healthy: true, latencyMs: 5 },
      queue: { healthy: true, latencyMs: 8 },
      all_healthy: false,
    };

    const result = analyzer.analyze(checks);
    expect(result.score).toBe(65);
    expect(result.severity).toBe('degraded');
  });

  it('should classify UNHEALTHY severity when 2 or more checks fail', () => {
    const checks: any = {
      database: { healthy: false, latencyMs: 100 },
      redis: { healthy: false, latencyMs: 50 },
      queue: { healthy: true, latencyMs: 8 },
      all_healthy: false,
    };

    const severity = analyzer.determineSeverity(30, checks);
    expect(severity).toBe('unhealthy');
  });
});
