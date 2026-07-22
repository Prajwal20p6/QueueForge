import { getTestConfig } from '../../helpers/test-config';
import { createTestLogger } from '../../helpers/test-logger';
import { createTestObservability } from '../../helpers/test-observability';
import { createTestContainer } from '../../helpers/test-container';

describe('Test Helpers Infrastructure Unit Tests', () => {
  it('should generate strongly-typed test configuration', () => {
    const config = getTestConfig();
    expect(config.database.url).toBeDefined();
    expect(config.redis.host).toBeDefined();
    expect(config.secrets.jwtSecret).toBeDefined();
  });

  it('should instantiate test logger without throwing errors', () => {
    const logger = createTestLogger('test-suite');
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
  });

  it('should instantiate mock observability context', () => {
    const obs = createTestObservability();
    expect(obs.logger).toBeDefined();
    expect(obs.tracer).toBeDefined();
    expect(obs.metricsRegistry).toBeDefined();
    expect(obs.auditLogger).toBeDefined();
  });

  it('should pre-populate test DI container', () => {
    const container = createTestContainer();
    expect(container.has('config')).toBe(true);
    expect(container.has('logger')).toBe(true);
    expect(container.has('observability')).toBe(true);
  });
});
