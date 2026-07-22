import { MetricsCollector } from '../../../../src/daemon/metrics/metrics-collector';

describe('MetricsCollector Unit Tests', () => {
  let daemon: MetricsCollector;
  let mockAggregator: any;

  beforeEach(() => {
    mockAggregator = {
      aggregate: jest.fn().mockResolvedValue({ collected: 3, failed: 0, duration: 12 }),
    };

    daemon = new MetricsCollector({ intervalMs: 1000 }, { aggregator: mockAggregator });
  });

  it('should run collection cycle via aggregator', async () => {
    await daemon.execute();
    expect(mockAggregator.aggregate).toHaveBeenCalled();
  });
});
