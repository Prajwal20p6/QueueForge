import { DaemonCoordinator } from '../../../src/daemon';

describe('DaemonCoordinator Integration Tests', () => {
  let coordinator: DaemonCoordinator;
  let recovery: any;
  let health: any;
  let metrics: any;
  let logger: any;
  let metricsRegistry: any;

  beforeEach(() => {
    recovery = {
      start: jest.fn(),
      stop: jest.fn(),
      isRunning: jest.fn().mockReturnValue(true),
    };
    health = {
      start: jest.fn(),
      stop: jest.fn(),
      isRunning: jest.fn().mockReturnValue(true),
    };
    metrics = {
      start: jest.fn(),
      stop: jest.fn(),
      isRunning: jest.fn().mockReturnValue(true),
    };
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    metricsRegistry = {};

    coordinator = new DaemonCoordinator(recovery, health, metrics, logger, metricsRegistry);
  });

  it('should initialize and orchestrate status retrievals of all coordinators', async () => {
    await coordinator.start();
    expect(coordinator.isRunning()).toBe(true);
    expect(health.start).toHaveBeenCalled();
    expect(metrics.start).toHaveBeenCalled();
    expect(recovery.start).toHaveBeenCalled();

    const status = await coordinator.getStatus();
    expect(status.running).toBe(true);
    expect(status.recovery).toBe(true);
    expect(status.health).toBe(true);
    expect(status.metrics).toBe(true);

    await coordinator.stop();
    expect(coordinator.isRunning()).toBe(false);
  });
});
