import { GaugeMetrics } from '../../../../src/observability/metrics/gauges';
import client from 'prom-client';

describe('GaugeMetrics Unit Tests', () => {
  let gauges: GaugeMetrics;
  let logger: any;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    client.register.clear();
    gauges = new GaugeMetrics({}, logger);
  });

  it('should set main and delayed queue depth values correctly', async () => {
    gauges.setQueueDepth('main', 42);
    gauges.setQueueDepth('delayed', 17);

    const mainDepth = client.register.getSingleMetric('queue_depth_main') as any;
    const delayedDepth = client.register.getSingleMetric('queue_depth_delayed') as any;

    const mainData = await mainDepth.get();
    const delayedData = await delayedDepth.get();

    expect(mainData.values[0]?.value).toBe(42);
    expect(delayedData.values[0]?.value).toBe(17);
  });

  it('should set circuit_breaker_state gauge values correctly', async () => {
    gauges.setCircuitBreakerState('dest-1', 'open');

    const breakerState = client.register.getSingleMetric('circuit_breaker_state') as any;
    expect(breakerState).toBeDefined();

    const data = await breakerState.get();
    const openVal = data.values.find((v: any) => v.labels.destination_id === 'dest-1' && v.labels.state === 'open');
    const closedVal = data.values.find((v: any) => v.labels.destination_id === 'dest-1' && v.labels.state === 'closed');

    expect(openVal?.value).toBe(1);
    expect(closedVal?.value).toBe(0);
  });

  it('should set active PostgreSQL and Redis pool connection gauges successfully', async () => {
    gauges.setDatabaseConnections(5, 10);
    gauges.setRedisConnections(3, 7);

    const dbActive = client.register.getSingleMetric('database_connections_active') as any;
    const redisActive = client.register.getSingleMetric('redis_connections_active') as any;

    const dbData = await dbActive.get();
    const redisData = await redisActive.get();

    expect(dbData.values[0]?.value).toBe(5);
    expect(redisData.values[0]?.value).toBe(3);
  });
});
