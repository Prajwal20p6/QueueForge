import { MetricsCollectorCoordinator } from '../../../src/daemon/metrics';

describe('Metrics Subsystem Integration Tests', () => {
  let coordinator: MetricsCollectorCoordinator;
  let queueCollector: any;
  let deliveryCollector: any;
  let logger: any;

  beforeEach(() => {
    queueCollector = {
      start: jest.fn(),
      stop: jest.fn(),
      collectMetrics: jest.fn().mockResolvedValue({
        depth: { main: 2, delayed: 1, dlq: 0 },
        throughput: 10,
        successRate: 100,
        avgLatency: 45,
      }),
    };
    deliveryCollector = {
      start: jest.fn(),
      stop: jest.fn(),
      collectMetrics: jest.fn().mockResolvedValue({
        successRate: 98,
        failureRate: 2,
        dlqRate: 2,
        avgRetries: 1.2,
        avgLatency: 110,
        byDestinationType: {},
      }),
    };
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    coordinator = new MetricsCollectorCoordinator(queueCollector, deliveryCollector, logger);
  });

  it('should run collection cycles on startup and aggregate metrics on request', async () => {
    await coordinator.start();
    expect(coordinator.isRunning()).toBe(true);

    const allMetrics = await coordinator.getAllMetrics();
    expect(allMetrics.queue.depth.main).toBe(2);
    expect(allMetrics.delivery.successRate).toBe(98);

    await coordinator.stop();
    expect(coordinator.isRunning()).toBe(false);
  });
});
