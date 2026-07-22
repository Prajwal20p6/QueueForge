import { QueueMetricsCollector } from '../../../src/daemon/metrics/queue-metrics';

describe('Metrics Scraper Accuracy Chaos Tests', () => {
  let collector: QueueMetricsCollector;
  let queue: any;
  let metrics: any;
  let logger: any;

  beforeEach(() => {
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
  });

  it('should tolerate queue transient errors and reuse last collected stats or throw cleanly', async () => {
    queue = {
      getWaitingCount: jest.fn().mockRejectedValue(new Error('Redis connection lost')),
      getActiveCount: jest.fn().mockResolvedValue(0),
      getDelayedCount: jest.fn().mockResolvedValue(0),
      getCompletedCount: jest.fn().mockResolvedValue(0),
      getFailedCount: jest.fn().mockResolvedValue(0),
    };

    collector = new QueueMetricsCollector(queue, metrics, logger);

    await expect(collector.collectMetrics()).rejects.toThrow('Redis connection lost');
  });
});
