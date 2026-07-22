import { HealthCheckDaemonCoordinator } from '../../../src/daemon/health';

describe('Health Check Resilience Chaos Tests', () => {
  let coordinator: HealthCheckDaemonCoordinator;
  let checker: any;
  let monitor: any;
  let logger: any;
  let metrics: any;

  beforeEach(() => {
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
  });

  it('should tolerate database connection failures, record UNHEALTHY, and emit alert events', async () => {
    checker = {
      checkAll: jest.fn().mockRejectedValue(new Error('Connection refused')),
    };
    monitor = {
      checkWorkerHealth: jest.fn().mockResolvedValue({
        activeWorkers: 0,
        staleWorkers: 0,
        totalWorkers: 0,
      }),
      isHealthy: jest.fn().mockResolvedValue(false),
    };

    coordinator = new HealthCheckDaemonCoordinator(checker, monitor, logger, metrics);

    const alertPromise = new Promise<void>((resolve) => {
      coordinator.on('HealthCheckFailedEvent', (event) => {
        expect(event.overall).toBe('UNHEALTHY');
        expect(event.issues).toContain('Connection refused');
        resolve();
      });
    });

    const status = await coordinator.check();
    expect(status.status).toBe('UNHEALTHY');
    await alertPromise;
  });
});
