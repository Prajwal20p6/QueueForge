import { QueueMetricsCollector } from '../../../../src/daemon/metrics/queue-metrics-collector';

describe('QueueMetricsCollector Unit Tests', () => {
  let collector: QueueMetricsCollector;
  let mockQueueManager: any;

  beforeEach(() => {
    mockQueueManager = {
      getStats: jest.fn().mockResolvedValue({ mainDepth: 15, delayedDepth: 4, dlqDepth: 1 }),
    };

    collector = new QueueMetricsCollector(mockQueueManager);
  });

  it('should sample queue depths accurately', async () => {
    const stats = await collector.collect();
    expect(stats.mainDepth).toBe(15);
    expect(stats.delayedDepth).toBe(4);
    expect(stats.dlqDepth).toBe(1);
  });
});
