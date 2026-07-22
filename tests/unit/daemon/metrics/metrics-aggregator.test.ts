import { MetricsAggregator } from '../../../../src/daemon/metrics/metrics-aggregator';

describe('MetricsAggregator Unit Tests', () => {
  let aggregator: MetricsAggregator;
  let mockCollector1: any;
  let mockCollector2: any;

  beforeEach(() => {
    mockCollector1 = {
      name: 'Collector1',
      collect: jest.fn().mockResolvedValue({ a: 1 }),
    };

    mockCollector2 = {
      name: 'Collector2',
      collect: jest.fn().mockRejectedValue(new Error('Sampling failed')),
    };

    aggregator = new MetricsAggregator([mockCollector1, mockCollector2]);
  });

  it('should run all collectors and catch errors without failing overall aggregation', async () => {
    const res = await aggregator.aggregate();
    expect(res.collected).toBe(1);
    expect(res.failed).toBe(1);
    expect(res.duration).toBeGreaterThanOrEqual(0);
  });

  it('should register and unregister collectors', () => {
    const c3 = { name: 'Collector3', collect: jest.fn() };
    aggregator.registerCollector(c3);
    aggregator.unregisterCollector('Collector3');
  });
});
