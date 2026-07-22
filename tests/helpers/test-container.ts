import { Container } from '../../src/bootstrap/container';
import { getTestConfig } from './test-config';
import { createTestLogger } from './test-logger';
import { createTestObservability } from './test-observability';

/**
 * Creates pre-populated Dependency Injection Container for testing.
 */
export function createTestContainer(): Container {
  const container = new Container();

  const config = getTestConfig();
  const logger = createTestLogger();
  const observability = createTestObservability();

  container.register('config', () => config);
  container.register('logger', () => logger);
  container.register('observability', () => observability);

  return container;
}
