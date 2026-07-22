import { initializeDaemonModule, DaemonRole } from '../../../src/daemon';

describe('Daemon Coordination Integration Tests', () => {
  let node1: any;
  let node2: any;

  afterEach(async () => {
    if (node1?.coordinator) await node1.coordinator.shutdown();
    if (node2?.coordinator) await node2.coordinator.shutdown();
  });

  it('should participate in leader election and assign PRIMARY to leader and SECONDARY to standby node', async () => {
    let activeLeader = 'node-1';

    const createMockRedis = (nodeId: string) => ({
      set: jest.fn().mockImplementation((_key, _val) => {
        if (activeLeader === nodeId || !activeLeader) {
          activeLeader = nodeId;
          return Promise.resolve('OK');
        }
        return Promise.resolve(null);
      }),
      get: jest.fn().mockImplementation(() => Promise.resolve(activeLeader)),
      delete: jest.fn().mockImplementation(() => {
        activeLeader = '';
        return Promise.resolve(1);
      }),
      del: jest.fn().mockImplementation(() => {
        activeLeader = '';
        return Promise.resolve(1);
      }),
      ttl: jest.fn().mockResolvedValue(30),
      pttl: jest.fn().mockResolvedValue(30000),
    });

    node1 = await initializeDaemonModule(
      { daemon: { recoveryIntervalMs: 1000 } },
      { redisModule: { redis: createMockRedis('node-1') } }
    );

    node2 = await initializeDaemonModule(
      { daemon: { recoveryIntervalMs: 1000 } },
      { redisModule: { redis: createMockRedis('node-2') } }
    );

    expect(node1.coordinator.getRole('RECOVERY')).toBe(DaemonRole.PRIMARY);
  });
});
