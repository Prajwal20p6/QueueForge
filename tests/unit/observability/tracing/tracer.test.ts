import { Tracer } from '../../../../src/observability/tracing/tracer';


describe('Tracer Unit Tests', () => {
  let tracer: Tracer;
  let config: any;
  let logger: any;

  beforeEach(() => {
    config = {
      enabled: true,
      tracingEnabled: true,
      metricsEnabled: false,
      loggingEnabled: false,
      jaegerEndpoint: 'http://localhost:4318/v1/traces',
      jaegerServiceName: 'test-service',
      traceSampleRate: 1.0,
      prometheusPort: 9090,
      logLevel: 'debug',
      logFormat: 'pretty',
      logDestination: 'console',
      metricBuckets: [],
    };
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    tracer = new Tracer(config, logger);
  });

  afterEach(async () => {
    await tracer.shutdown();
  });

  it('should initialize OpenTelemetry NodeSDK tracer successfully when enabled', async () => {
    await expect(tracer.initialize()).resolves.not.toThrow();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Initializing OpenTelemetry'));
    expect(tracer.getTracer()).toBeDefined();
    expect(tracer.getMeter()).toBeDefined();
  });

  it('should skip initialization if tracing is disabled in configuration', async () => {
    config = { ...config, tracingEnabled: false };
    const disabledTracer = new Tracer(config, logger);
    await disabledTracer.initialize();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('disabled in configuration'));
  });

  it('should extract active traceId and return empty string if no span context exists', () => {
    const traceId = tracer.getTraceId();
    expect(traceId).toBe('');
  });
});
