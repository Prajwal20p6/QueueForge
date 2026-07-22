import { DeliveryMetricsCollector } from '../../../../src/daemon/metrics/delivery-metrics';

jest.mock('../../../../src/infrastructure/database/client', () => ({
  getPrismaClient: jest.fn().mockReturnValue({
    taskResultDelivery: {
      count: jest.fn().mockImplementation((args) => {
        if (args?.where?.status === 'COMPLETED') return Promise.resolve(8);
        if (args?.where?.status === 'FAILED_DLQ') return Promise.resolve(2);
        return Promise.resolve(10);
      }),
      aggregate: jest.fn().mockResolvedValue({
        _avg: { retryCount: 1.5 },
      }),
      findMany: jest.fn().mockResolvedValue([
        { id: 'del-1', retryCount: 1, status: 'COMPLETED', destination: { destinationType: 'WEBHOOK' } },
        { id: 'del-2', retryCount: 2, status: 'FAILED_DLQ', destination: { destinationType: 'WEBHOOK' } },
      ]),
    },
    taskResultDeliveryAttempt: {
      aggregate: jest.fn().mockResolvedValue({
        _avg: { responseTimeMs: 150 },
      }),
      findMany: jest.fn().mockResolvedValue([
        { responseTimeMs: 100, delivery: { destination: { destinationType: 'WEBHOOK' } } },
        { responseTimeMs: 200, delivery: { destination: { destinationType: 'WEBHOOK' } } },
      ]),
    },
  }),
}));

describe('DeliveryMetricsCollector Unit Tests', () => {
  let collector: DeliveryMetricsCollector;
  let repository: any;
  let metrics: any;
  let logger: any;

  beforeEach(() => {
    repository = {};
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

    collector = new DeliveryMetricsCollector(repository, metrics, logger);
  });

  it('should query delivery counts, averages and destination breakdowns from database', async () => {
    const res = await collector.collectMetrics();
    expect(res.successRate).toBe(80);
    expect(res.failureRate).toBe(20);
    expect(res.avgRetries).toBe(1.5);
    expect(res.avgLatency).toBe(150);
    expect(res.byDestinationType['WEBHOOK'].count).toBe(2);
  });
});
