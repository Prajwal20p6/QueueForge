import { DaemonCoordinator } from '../../../../src/daemon/coordinator/daemon-coordinator';
import { DaemonType, DaemonRole } from '../../../../src/daemon/coordinator/coordination';
import { BaseDaemon } from '../../../../src/daemon/base-daemon';

class MockDaemon extends BaseDaemon {
  public async execute(): Promise<void> {}
}

describe('DaemonCoordinator Unit Tests', () => {
  let coordinator: DaemonCoordinator;
  let mockDaemon: MockDaemon;

  beforeEach(() => {
    coordinator = new DaemonCoordinator(null, null, 'node-test');
    mockDaemon = new MockDaemon('TestDaemon', 1000);
  });

  afterEach(async () => {
    await coordinator.shutdown();
  });

  it('should register daemon and assign PRIMARY role for singleton when election succeeds', async () => {
    await coordinator.registerDaemon(DaemonType.RECOVERY, mockDaemon);
    const role = coordinator.getRole(DaemonType.RECOVERY);

    expect(role).toBe(DaemonRole.PRIMARY);

    const daemons = await coordinator.getAllDaemons();
    expect(daemons).toHaveLength(1);
    expect(daemons[0].name).toBe('TestDaemon');
  });

  it('should assign PRIMARY role for non-singleton daemons on all nodes', () => {
    const role = coordinator.getRole(DaemonType.HEALTH);
    expect(role).toBe(DaemonRole.PRIMARY);
  });

  it('should deregister daemon cleanly', async () => {
    await coordinator.registerDaemon(DaemonType.HEALTH, mockDaemon);
    await coordinator.deregisterDaemon(DaemonType.HEALTH);

    const daemons = await coordinator.getAllDaemons();
    expect(daemons).toHaveLength(0);
  });
});
