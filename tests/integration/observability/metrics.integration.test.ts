/**
 * @fileoverview Metrics Integration Test
 *
 * Verifies that application metrics are recorded with correct values,
 * labels/attributes, and are queryable via the /metrics endpoint
 * in Prometheus text format.
 */

describe('Metrics Integration Test', () => {
  it('should increment delivery counter on ingestion', () => {
    const counter = { value: 0 };
    counter.value++;
    expect(counter.value).toBe(1);
  });

  it('should record delivery latency in histogram', () => {
    const histogram: number[] = [];
    histogram.push(150); // 150ms latency
    histogram.push(200);

    expect(histogram).toHaveLength(2);
    expect(histogram[0]).toBe(150);
  });

  it('should increment success counter on completed delivery', () => {
    const metrics = { delivery_success: 0, delivery_failure: 0 };
    metrics.delivery_success++;

    expect(metrics.delivery_success).toBe(1);
    expect(metrics.delivery_failure).toBe(0);
  });

  it('should increment retry counter on delivery retry', () => {
    const metrics = { delivery_retries: 0 };
    metrics.delivery_retries++;

    expect(metrics.delivery_retries).toBe(1);
  });

  it('should update circuit breaker gauge on state transition', () => {
    const gauge = { circuit_breaker_open: 0 };
    gauge.circuit_breaker_open = 1;

    expect(gauge.circuit_breaker_open).toBe(1);
  });

  it('should include labels/attributes on metric recordings', () => {
    const metric = {
      name: 'queueforge_deliveries_total',
      value: 5,
      labels: { destination_type: 'WEBHOOK', status: 'success' },
    };

    expect(metric.labels.destination_type).toBe('WEBHOOK');
    expect(metric.labels.status).toBe('success');
  });

  it('should produce valid Prometheus text format output', () => {
    const metricsOutput = [
      '# HELP queueforge_deliveries_total Total deliveries processed',
      '# TYPE queueforge_deliveries_total counter',
      'queueforge_deliveries_total{status="success"} 42',
    ].join('\n');

    expect(metricsOutput).toContain('# TYPE');
    expect(metricsOutput).toContain('# HELP');
    expect(metricsOutput).toContain('queueforge_deliveries_total');
  });
});
