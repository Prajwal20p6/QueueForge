import { QueueMetricsCollector } from '../../../../src/daemon/metrics/queue-metrics';

describe('QueueMetricsCollector Unit Tests', () => {
  let collector: QueueMetricsCollector;
  let queue: any;
  let metrics: any;
  let logger: any;

  beforeEach(() => {
    queue = {
      getWaitingCount: jest.fn().mockResolvedValue(5),
      getActiveCount: jest.fn().mockResolvedValue(2),
      getDelayedCount: jest.fn().mockResolvedValue(3),
      getCompletedCount: jest.fn().mockResolvedValue(100),
      getFailedCount: jest.fn().mockResolvedValue(5),
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

    collector = new QueueMetricsCollector(queue, metrics, logger);
  });

  it('should compile queue counts, throughput, success rate and export metrics', async () => {
    const res = await collector.collectMetrics();
    expect(res.depth.main).toBe(7); // waiting + active
    expect(res.depth.delayed).toBe(3);
    expect(res.depth.dlq).toBe(5);
    expect(res.successRate).toBeCloseTo(95.24);
  });
});
