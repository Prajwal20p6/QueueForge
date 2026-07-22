import { StaleJobDetector } from '../../../../src/daemon/recovery/stale-job-detector';

describe('StaleJobDetector Unit Tests', () => {
  let detector: StaleJobDetector;
  let mockDeliveryRepo: any;
  let mockHeartbeat: any;

  beforeEach(() => {
    mockDeliveryRepo = {
      findStaleDeliveries: jest.fn().mockResolvedValue([
        { id: 'del-1', status: 'PROCESSING', updatedAt: new Date(Date.now() - 60000) },
      ]),
      findById: jest.fn().mockImplementation(id => (id === 'del-1' ? { id } : null)),
    };

    mockHeartbeat = {
      getAllWorkerIds: jest.fn().mockResolvedValue(['w-1', 'w-2']),
      isAlive: jest.fn().mockImplementation(id => Promise.resolve(id === 'w-1')),
    };

    detector = new StaleJobDetector(mockDeliveryRepo, mockHeartbeat);
  });

  it('should detect stale deliveries updated before cutoff', async () => {
    const stale = await detector.detectStale(30000);
    expect(stale).toHaveLength(1);
    expect(stale[0].id).toBe('del-1');
    expect(mockDeliveryRepo.findStaleDeliveries).toHaveBeenCalled();
  });

  it('should identify orphaned queue jobs missing from database', async () => {
    const queueJobs = [{ id: 'del-1' }, { id: 'del-orphaned' }];
    const orphaned = await detector.detectOrphaned(queueJobs);

    expect(orphaned).toHaveLength(1);
    expect(orphaned[0].id).toBe('del-orphaned');
  });

  it('should detect dead workers with expired heartbeats', async () => {
    const dead = await detector.detectDeadWorkers();
    expect(dead).toEqual(['w-2']);
  });
});
