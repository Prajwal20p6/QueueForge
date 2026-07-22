import { LeaderElection } from '../../../../src/daemon/coordinator/leader-election';

describe('LeaderElection Unit Tests', () => {
  let election: LeaderElection;
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue('node-1'),
      del: jest.fn().mockResolvedValue(1),
      delete: jest.fn().mockResolvedValue(1),
      ttl: jest.fn().mockResolvedValue(30),
    };

    election = new LeaderElection('node-1', mockRedis);
  });

  it('should acquire leadership lease when SET returns OK', async () => {
    const acquired = await election.participate();
    expect(acquired).toBe(true);
    expect(election.isLeader()).toBe(true);
  });

  it('should resign leadership lease cleanly', async () => {
    await election.participate();
    await election.resign();
    expect(election.isLeader()).toBe(false);
  });

  it('should return leader ID and lease TTL', async () => {
    await election.participate();
    const leader = await election.getLeader();
    const ttl = await election.getLeaseTTL();

    expect(leader).toBe('node-1');
    expect(ttl).toBeGreaterThan(0);
  });
});
