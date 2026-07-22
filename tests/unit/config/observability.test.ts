import {
  getObservabilityConfig,
  METRIC_RESULTS_INGESTED,
  SPAN_TASK_RECEIVED,
  DEFAULT_LATENCY_BUCKETS,
} from '../../../src/config/observability';
import { EnvConfig } from '../../../src/config/env';

describe('Config: observability.ts', () => {
  const baseMockEnv: Partial<EnvConfig> = {
    NODE_ENV: 'development',
    OTEL_TRACE_SAMPLE_RATE: 0.25,
    PROMETHEUS_PORT: 9091,
    JAEGER_ENDPOINT: 'http://jaeger:4318',
    APP_NAME: 'test-app',
    LOG_LEVEL: 'info',
  };

  it('should export correct metric and span constants names', () => {
    expect(METRIC_RESULTS_INGESTED).toBe('results_ingested_total');
    expect(SPAN_TASK_RECEIVED).toBe('task_received');
    expect(DEFAULT_LATENCY_BUCKETS).toEqual([0.1, 0.5, 1.0, 2.5, 5.0, 10.0]);
  });

  it('should build valid configurations from environment variables', () => {
    const config = getObservabilityConfig(baseMockEnv as EnvConfig);
    expect(config.traceSampleRate).toBe(0.25);
    expect(config.prometheusPort).toBe(9091);
    expect(config.jaegerEndpoint).toBe('http://jaeger:4318');
    expect(config.jaegerServiceName).toBe('test-app');
    expect(config.logFormat).toBe('pretty');
    expect(config.tracingEnabled).toBe(true);
  });

  it('should throw error when OTEL_TRACE_SAMPLE_RATE is out of bounds [0.0, 1.0]', () => {
    const badSample = { ...baseMockEnv, OTEL_TRACE_SAMPLE_RATE: 1.5 };
    expect(() => getObservabilityConfig(badSample as EnvConfig)).toThrow(
      /OTEL_TRACE_SAMPLE_RATE must be/
    );
  });

  it('should throw error when PROMETHEUS_PORT is out of range', () => {
    const badPort = { ...baseMockEnv, PROMETHEUS_PORT: 70000 };
    expect(() => getObservabilityConfig(badPort as EnvConfig)).toThrow(/PROMETHEUS_PORT must be/);
  });

  it('should freeze the returned config object', () => {
    const config = getObservabilityConfig(baseMockEnv as EnvConfig);
    expect(Object.isFrozen(config)).toBe(true);
  });
});
