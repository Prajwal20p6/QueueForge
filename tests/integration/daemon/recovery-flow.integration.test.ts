import { initializeDaemonModule } from '../../../src/daemon';

describe('Recovery Flow Integration Tests', () => {
  let module: any;

  afterEach(async () => {
    if (module?.coordinator) {
      await module.coordinator.shutdown();
    }
  });

  it('should initialize recovery daemon, detect stale deliveries, and execute recovery flow', async () => {
    const mockRepo = {
      deliveries: {
        findStaleDeliveries: jest.fn().mockResolvedValue([
          { id: 'del-stale-1', status: 'PROCESSING', retryCount: 0, maxRetries: 3 },
        ]),
        findByStatus: jest.fn().mockImplementation(st => {
          if (st === 'PENDING') return Promise.resolve([{ id: 'del-stale-1' }]);
          return Promise.resolve([]);
        }),
      },
    };

    const mockQueueManager = {
      getMainQueue: () => ({
        add: jest.fn().mockResolvedValue({ id: 'job-1' }),
        getJobs: jest.fn().mockResolvedValue([]),
      }),
      getDelayedQueue: () => ({
        add: jest.fn().mockResolvedValue({ id: 'job-2' }),
      }),
    };

    module = await initializeDaemonModule(
      { daemon: { recoveryIntervalMs: 500 } },
      { repositories: mockRepo, queueManager: mockQueueManager }
    );

    expect(module.daemons.recovery).toBeDefined();

    // Trigger one manual cycle
    await module.daemons.recovery.execute();

    expect(mockRepo.deliveries.findStaleDeliveries).toHaveBeenCalled();
  });
});
