import { initializeDaemonModule } from '../../../src/daemon';

describe('Metrics Collection Integration Tests', () => {
  let module: any;

  afterEach(async () => {
    if (module?.coordinator) {
      await module.coordinator.shutdown();
    }
  });

  it('should run metrics collection daemon cycle across queue, delivery, and system collectors', async () => {
    const mockRepo = {
      deliveries: {
        countByStatus: jest.fn().mockResolvedValue(10),
      },
    };

    const mockQueueManager = {
      getStats: jest.fn().mockResolvedValue({ mainDepth: 2, delayedDepth: 0, dlqDepth: 0 }),
    };

    module = await initializeDaemonModule(
      { daemon: { metricsCollectionIntervalMs: 500 } },
      { repositories: mockRepo, queueManager: mockQueueManager }
    );

    expect(module.daemons.metrics).toBeDefined();

    await module.daemons.metrics.execute();

    const status = module.daemons.metrics.getStatus();
    expect(status.name).toBe('MetricsCollector');
  });
});
