import { WorkerMonitor } from '../../../../src/worker/recovery/worker-monitor';

describe('WorkerMonitor Unit Tests', () => {
  it('should query status and health across worker services', async () => {
    const mockProcessor = {
      getStats: jest.fn().mockReturnValue({ jobsProcessed: 10, jobsFailed: 1, activeJobs: 2 }),
      isStopped: false,
    };

    const mockHeartbeat = {
      workerId: 'worker-node-1',
      isAlive: jest.fn().mockResolvedValue(true),
    };

    const monitor = new WorkerMonitor(mockProcessor, mockHeartbeat);

    const status = await monitor.getStatus();
    expect(status.workerId).toBe('worker-node-1');
    expect(status.alive).toBe(true);
    expect(status.jobsProcessed).toBe(10);

    const health = await monitor.getHealth();
    expect(health.healthy).toBe(true);
    expect(health.checks.heartbeatActive).toBe(true);
    expect(health.checks.processorRunning).toBe(true);
  });
});
