import { loadObservabilityConfig } from '../../../src/config/observability.config';
import { LogLevel } from '../../../src/shared/constants/app.constants';

describe('Config: observability.config.ts', () => {
  it('should successfully build ObservabilityConfig', () => {
    process.env.LOG_LEVEL = 'info';
    const config = loadObservabilityConfig();
    expect(config.tracing.enabled).toBe(true);
    expect(config.metrics.prometheusPort).toBe(9090);
    expect(config.logging.level).toBe(LogLevel.INFO);
    expect(config.audit.enabled).toBe(true);
  });
});
