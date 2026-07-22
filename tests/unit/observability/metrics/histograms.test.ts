import { HistogramMetrics } from '../../../../src/observability/metrics/histograms';
import client from 'prom-client';

describe('HistogramMetrics Unit Tests', () => {
  let histograms: HistogramMetrics;
  let logger: any;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    client.register.clear();
    histograms = new HistogramMetrics({}, logger);
  });

  it('should observe latency events and update counts', async () => {
    histograms.recordDeliveryLatency(500, { destination_type: 'webhook' }); // 0.5s

    const deliveryMetric = client.register.getSingleMetric('delivery_latency_seconds') as any;
    expect(deliveryMetric).toBeDefined();

    const data = await deliveryMetric.get();
    const sumMetric = data.values.find((v: any) => v.metricName === 'delivery_latency_seconds_sum' && v.labels.destination_type === 'webhook');
    expect(sumMetric?.value).toBe(0.5);
  });

  it('should observe auth and validation metrics successfully', async () => {
    histograms.recordAuthLatency(45, { auth_type: 'jwt' });
    histograms.recordValidationLatency(5);

    const authMetric = client.register.getSingleMetric('auth_latency_ms') as any;
    const valMetric = client.register.getSingleMetric('validation_latency_ms') as any;

    const authData = await authMetric.get();
    const valData = await valMetric.get();

    const authSum = authData.values.find((v: any) => v.metricName === 'auth_latency_ms_sum' && v.labels.auth_type === 'jwt');
    const valSum = valData.values.find((v: any) => v.metricName === 'validation_latency_ms_sum');

    expect(authSum?.value).toBe(45);
    expect(valSum?.value).toBe(5);
  });
});
