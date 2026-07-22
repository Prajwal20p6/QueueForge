import { DLQMonitor } from '../../../../src/daemon/recovery/dlq-monitor';

describe('DLQMonitor Unit Tests', () => {
  let monitor: DLQMonitor;
  let queue: any;
  let repository: any;
  let logger: any;
  let metrics: any;

  beforeEach(() => {
    queue = {};
    repository = {
      findMany: jest.fn().mockResolvedValue({
        data: [{ id: 'del-1', createdAt: new Date() }],
        total: 10,
      }),
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

    monitor = new DLQMonitor(queue, repository, logger, metrics);
  });

  it('should scan DLQ stats and emit growth alert if thresholds breached', async () => {
    const alertPromise = new Promise<void>((resolve) => {
      monitor.on('DLQGrowthAlertEvent', (event) => {
        expect(event.size).toBe(10);
        resolve();
      });
    });

    // Mock high size to trigger alert
    (monitor as any).alertThreshold = 5;

    const res = await monitor.monitor();
    expect(res.size).toBe(10);
    await alertPromise;
  });
});
