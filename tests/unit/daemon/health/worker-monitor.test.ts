import { WorkerMonitor } from '../../../../src/daemon/health/worker-monitor';

describe('WorkerMonitor Unit Tests', () => {
  let monitor: WorkerMonitor;
  let redis: any;
  let logger: any;
  let metrics: any;

  beforeEach(() => {
    redis = {
      smembers: jest.fn().mockResolvedValue(['worker-1', 'worker-2']),
      pipeline: jest.fn().mockReturnValue({
        exists: jest.fn(),
        exec: jest.fn().mockResolvedValue([
          [null, 1], // worker-1 active
          [null, 0], // worker-2 stale
        ]),
      }),
      ttl: jest.fn().mockResolvedValue(15),
      hgetall: jest.fn().mockResolvedValue({ active: '1', processed: '10', failed: '0', uptime: '120' }),
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

    monitor = new WorkerMonitor(redis, logger, metrics);
  });

  it('should distinguish active vs stale workers based on TTL keys', async () => {
    const health = await monitor.checkWorkerHealth();
    expect(health.activeWorkers).toBe(1);
    expect(health.staleWorkers).toBe(1);
    expect(health.totalWorkers).toBe(2);
  });

  it('should fetch stats and verify healthy flags', async () => {
    const healthy = await monitor.isHealthy(1);
    expect(healthy).toBe(true);
    
    const stats = await monitor.getWorkerStats();
    expect(stats['worker-1'].processedJobs).toBe(10);
  });
});
