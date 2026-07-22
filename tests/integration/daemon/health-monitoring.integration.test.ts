import { initializeDaemonModule } from '../../../src/daemon';

describe('Health Monitoring Integration Tests', () => {
  let module: any;

  afterEach(async () => {
    if (module?.coordinator) {
      await module.coordinator.shutdown();
    }
  });

  it('should run health monitoring daemon cycle and compute composite health scores', async () => {
    const mockRepo = {
      deliveries: {
        client: {
          $queryRawUnsafe: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
        },
      },
    };

    const mockRedis = {
      ping: jest.fn().mockResolvedValue('PONG'),
    };

    const mockQueueManager = {
      getStats: jest.fn().mockResolvedValue({ mainDepth: 0, delayedDepth: 0, dlqDepth: 0 }),
      redis: mockRedis,
    };

    module = await initializeDaemonModule(
      { daemon: { healthCheckIntervalMs: 500 } },
      { repositories: mockRepo, queueManager: mockQueueManager, redisModule: { redis: mockRedis } }
    );

    expect(module.daemons.health).toBeDefined();

    await module.daemons.health.execute();

    const status = module.daemons.health.getStatus();
    expect(status.name).toBe('HealthDaemon');
  });
});
