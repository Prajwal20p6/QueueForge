import { RecoveryDaemonCoordinator } from '../../../src/daemon/recovery';

describe('Recovery Subsystem Integration Tests', () => {
  let coordinator: RecoveryDaemonCoordinator;
  let delayedQueueProcessor: any;
  let stateSync: any;
  let dlqMonitor: any;
  let logger: any;

  beforeEach(() => {
    delayedQueueProcessor = {
      start: jest.fn(),
      stop: jest.fn(),
      isRunning: jest.fn().mockReturnValue(true),
    };
    stateSync = {
      start: jest.fn(),
      stop: jest.fn(),
      isRunning: jest.fn().mockReturnValue(true),
    };
    dlqMonitor = {
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

    coordinator = new RecoveryDaemonCoordinator(
      delayedQueueProcessor,
      stateSync,
      dlqMonitor,
      logger
    );
  });

  it('should initialize and stop recovery coordinators gracefully', async () => {
    await coordinator.start();
    expect(coordinator.isRunning()).toBe(true);
    expect(delayedQueueProcessor.start).toHaveBeenCalled();
    expect(stateSync.start).toHaveBeenCalled();
    expect(dlqMonitor.start).toHaveBeenCalled();

    await coordinator.stop();
    expect(coordinator.isRunning()).toBe(false);
    expect(delayedQueueProcessor.stop).toHaveBeenCalled();
    expect(stateSync.stop).toHaveBeenCalled();
    expect(dlqMonitor.stop).toHaveBeenCalled();
  });
});
