import { CounterMetrics } from '../../../../src/observability/metrics/counters';
import client from 'prom-client';

describe('CounterMetrics Unit Tests', () => {
  let counters: CounterMetrics;
  let logger: any;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    client.register.clear();
    counters = new CounterMetrics({}, logger);
  });

  it('should increment results_ingested_total counter with correct label entries', async () => {
    counters.incrementResultsIngested(1, { agent_id: 'agent-101' });
    const singleMetric = client.register.getSingleMetric('results_ingested_total') as any;
    expect(singleMetric).toBeDefined();

    const data = await singleMetric.get();
    const result = data.values.find((v: any) => v.labels.agent_id === 'agent-101');
    expect(result?.value).toBe(1);
  });

  it('should increment delivery_attempts_total counter correctly', async () => {
    counters.incrementDeliveryAttempts(2, { destination_type: 'webhook' });
    const singleMetric = client.register.getSingleMetric('delivery_attempts_total') as any;
    expect(singleMetric).toBeDefined();

    const data = await singleMetric.get();
    const result = data.values.find((v: any) => v.labels.destination_type === 'webhook');
    expect(result?.value).toBe(2);
  });

  it('should increment rate limit counters correctly', async () => {
    counters.incrementRateLimitHits();
    counters.incrementRateLimitViolations();

    const hits = client.register.getSingleMetric('rate_limit_hits_total') as any;
    const violations = client.register.getSingleMetric('rate_limit_violations_total') as any;

    const hitsData = await hits.get();
    const violationsData = await violations.get();

    expect(hitsData.values[0]?.value).toBe(1);
    expect(violationsData.values[0]?.value).toBe(1);
  });
});
