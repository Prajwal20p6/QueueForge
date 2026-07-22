import { DeliveryMetricsCollector } from '../../../../src/daemon/metrics/delivery-metrics-collector';

describe('DeliveryMetricsCollector Unit Tests', () => {
  let collector: DeliveryMetricsCollector;
  let mockDeliveryRepo: any;

  beforeEach(() => {
    mockDeliveryRepo = {
      countByStatus: jest.fn().mockImplementation(st => {
        if (st === 'COMPLETED') return Promise.resolve(100);
        if (st === 'PENDING') return Promise.resolve(5);
        return Promise.resolve(0);
      }),
    };

    collector = new DeliveryMetricsCollector(mockDeliveryRepo);
  });

  it('should sample status distributions and count metrics', async () => {
    const counts = await collector.collect();
    expect(counts.COMPLETED).toBe(100);
    expect(counts.PENDING).toBe(5);
  });
});
