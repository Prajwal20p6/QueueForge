import { QueueMonitor } from '../../../../src/resilience/backpressure/queue-monitor';

import { AuditLogger } from '../../../../src/infrastructure/repositories/base.repository';

describe('QueueMonitor Unit Tests', () => {
  const config: any = {
    circuitBreakerEnabled: true,
    circuitBreakerThreshold: 50,
    circuitBreakerTimeout: 60,
    circuitBreakerVolumeThreshold: 20,
    bulkheadEnabled: true,
    bulkheadPoolSizeWebhook: 5,
    bulkheadPoolSizeDatabase: 5,
    bulkheadPoolSizeQueue: 5,
    backpressureEnabled: true,
    backpressureQueueDepthThreshold: 100,
    backpressureAlarmThreshold: 80,
    backpressureSheddingStrategy: 'DROP_LATEST',
    maxRetries: 5,
    backoffBaseMs: 1000,
    backoffMaxMs: 10000,
    backoffJitterFactor: 0.2,
    retryableStatusCodes: [],
    permanentStatusCodes: [],
  };

  let mockQueue: any;
  let mockLogger: jest.Mocked<AuditLogger>;
  let monitor: QueueMonitor;

  beforeEach(() => {
    mockQueue = {
      getJobCounts: jest.fn().mockResolvedValue({ waiting: 20, active: 5, delayed: 3 }),
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    monitor = new QueueMonitor(mockQueue, config, mockLogger);
  });

  it('should compute total depth count from wait, active, and delayed job states', async () => {
    const depth = await monitor.getDepth();
    expect(depth).toBe(28); // 20 + 5 + 3
    expect(mockQueue.getJobCounts).toHaveBeenCalled();
  });

  it('should compute depth percentage based on configured limits', async () => {
    const pct = await monitor.getPercentageOfMax();
    expect(pct).toBeCloseTo(28, 4); // (28/100) * 100 = 28%
  });

  it('should evaluate backpressure flag correctly', async () => {
    expect(await monitor.isUnderBackpressure()).toBe(false);

    // Set job counts to breach threshold
    mockQueue.getJobCounts.mockResolvedValue({ waiting: 90, active: 0, delayed: 0 });
    // Clear check timestamp to bypass TTL
    (monitor as any).lastChecked = 0;

    expect(await monitor.isUnderBackpressure()).toBe(true); // 90% >= 80%
  });
});
