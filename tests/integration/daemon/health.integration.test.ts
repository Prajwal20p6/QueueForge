import { HealthCheckDaemonCoordinator } from '../../../src/daemon/health';

describe('Health Subsystem Integration Tests', () => {
  let coordinator: HealthCheckDaemonCoordinator;
  let checker: any;
  let monitor: any;
  let logger: any;
  let metrics: any;

  beforeEach(() => {
    checker = {
      checkAll: jest.fn().mockResolvedValue({
        timestamp: new Date(),
        database: 'HEALTHY',
        redis: 'HEALTHY',
        queue: 'HEALTHY',
        workers: { active: 1, stale: 0 },
        overall: 'HEALTHY',
      }),
    };
    monitor = {
      checkWorkerHealth: jest.fn().mockResolvedValue({
        activeWorkers: 2,
        staleWorkers: 0,
        totalWorkers: 2,
      }),
      isHealthy: jest.fn().mockResolvedValue(true),
    };
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    metrics = {
      getMeter: jest.fn().mockReturnValue({
        createUpDownCounter: jest.fn().mockReturnValue({
          add: jest.fn(),
        }),
      }),
    };

    coordinator = new HealthCheckDaemonCoordinator(checker, monitor, logger, metrics);
  });

  it('should run periodic check cycles and resolve overall statuses', async () => {
    await coordinator.start();
    expect(coordinator.isRunning()).toBe(true);

    const status = await coordinator.check();
    expect(status.status).toBe('HEALTHY');
    expect(checker.checkAll).toHaveBeenCalled();
    expect(monitor.checkWorkerHealth).toHaveBeenCalled();

    await coordinator.stop();
    expect(coordinator.isRunning()).toBe(false);
  });
});
