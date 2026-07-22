import { initializeDaemonModule } from '../../../src/daemon';

describe('Daemon Lifecycle Integration Tests', () => {
  let module: any;

  afterEach(async () => {
    if (module?.coordinator) {
      await module.coordinator.shutdown();
    }
  });

  it('should start and stop all background daemons cleanly without throwing errors', async () => {
    module = await initializeDaemonModule({ daemon: { intervalMs: 500 } });

    const daemons = await module.coordinator.getAllDaemons();
    expect(daemons.length).toBeGreaterThan(0);

    for (const d of daemons) {
      expect(d.running).toBe(true);
    }

    await module.coordinator.shutdown();

    const afterShutdown = await module.coordinator.getAllDaemons();
    expect(afterShutdown).toHaveLength(0);
  });
});
