import { HealthDaemon } from '../../../../src/daemon/health/health-daemon';

describe('HealthDaemon Unit Tests', () => {
  let daemon: HealthDaemon;
  let mockChecker: any;
  let mockAnalyzer: any;
  let mockAlerter: any;

  beforeEach(() => {
    mockChecker = {
      checkAll: jest.fn().mockResolvedValue({
        database: { healthy: true, latencyMs: 5 },
        redis: { healthy: true, latencyMs: 2 },
        queue: { healthy: true, latencyMs: 3 },
        all_healthy: true,
      }),
    };

    mockAnalyzer = {
      analyze: jest.fn().mockReturnValue({
        score: 100,
        severity: 'healthy',
        summary: 'All healthy',
        details: {},
      }),
    };

    mockAlerter = {
      publishAlert: jest.fn().mockResolvedValue(undefined),
      publishRecovery: jest.fn().mockResolvedValue(undefined),
    };

    daemon = new HealthDaemon({ intervalMs: 1000 }, {
      checker: mockChecker,
      analyzer: mockAnalyzer,
      alerter: mockAlerter,
    });
  });

  it('should execute health check cycle and update metrics', async () => {
    await daemon.execute();

    expect(mockChecker.checkAll).toHaveBeenCalled();
    expect(mockAnalyzer.analyze).toHaveBeenCalled();
  });

  it('should trigger alert when severity changes from healthy to unhealthy', async () => {
    await daemon.execute(); // Initial run: healthy

    mockAnalyzer.analyze.mockReturnValue({
      score: 0,
      severity: 'unhealthy',
      summary: 'DB Dead',
      details: {},
    });

    await daemon.execute(); // Second run: status changes to unhealthy

    expect(mockAlerter.publishAlert).toHaveBeenCalledWith('critical', expect.any(String), expect.any(Object));
  });
});
