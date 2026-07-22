import { setupLogger } from '../../../src/bootstrap/logger-setup';
import { Logger } from '../../../src/observability/logging/logger';

// Mock Logger constructor
jest.mock('../../../src/observability/logging/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('setupLogger Unit Tests', () => {
  const mockObservabilityConfig = {
    logLevel: 'info',
    tracingEnabled: false,
    metricsEnabled: false,
    serviceName: 'queueforge',
    traceExporterUrl: '',
    samplingRate: 1.0,
    prometheusPort: 9090,
  } as any;

  const mockConfig = {
    app: { name: 'QueueForge', environment: 'test', version: '1.0.0' },
    observability: mockObservabilityConfig,
  } as any;

  it('should return a configured Logger instance', () => {
    const logger = setupLogger(mockConfig);
    expect(logger).toBeDefined();
    expect(Logger).toHaveBeenCalledWith(mockObservabilityConfig, 'QueueForge');
  });

  it('should call logger.info after initialization', () => {
    const logger = setupLogger(mockConfig);
    expect(logger.info).toHaveBeenCalled();
  });

  it('should default service name to QueueForge when app.name is missing', () => {
    const configWithoutName = { ...mockConfig, app: {} };
    setupLogger(configWithoutName as any);
    expect(Logger).toHaveBeenCalledWith(mockObservabilityConfig, 'QueueForge');
  });
});
