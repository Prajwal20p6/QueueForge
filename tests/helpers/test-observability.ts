import { createTestLogger } from './test-logger';

/**
 * Creates ObservabilityContext populated with mock providers for unit/integration tests.
 */
export function createTestObservability(): any {
  const logger = createTestLogger();

  const mockTracer = {
    startSpan: jest.fn().mockReturnValue({
      setAttribute: jest.fn(),
      setStatus: jest.fn(),
      end: jest.fn(),
    }),
  };

  const mockMetrics = {
    getCounter: jest.fn().mockReturnValue({ add: jest.fn(), increment: jest.fn() }),
    getGauge: jest.fn().mockReturnValue({ set: jest.fn(), up: jest.fn(), down: jest.fn() }),
    getHistogram: jest.fn().mockReturnValue({ record: jest.fn() }),
  };

  const mockAuditLogger = {
    log: jest.fn().mockResolvedValue(undefined),
    logEvent: jest.fn().mockResolvedValue(undefined),
  };

  return {
    logger,
    tracer: mockTracer,
    metricsRegistry: mockMetrics,
    metrics: mockMetrics,
    auditLogger: mockAuditLogger,
    audit: mockAuditLogger,
  };
}
