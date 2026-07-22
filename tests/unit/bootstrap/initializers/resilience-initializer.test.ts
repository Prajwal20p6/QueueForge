import { Container } from '../../../../src/bootstrap/container';
import { ConfigInitializer } from '../../../../src/bootstrap/initializers/config-initializer';
import { ObservabilityInitializer } from '../../../../src/bootstrap/initializers/observability-initializer';
import { InfrastructureInitializer } from '../../../../src/bootstrap/initializers/infrastructure-initializer';
import { ResilienceInitializer } from '../../../../src/bootstrap/initializers/resilience-initializer';

describe('ResilienceInitializer Unit Tests', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    process.env.MOCK_REDIS = 'true';
  });

  afterEach(() => {
    delete process.env.MOCK_REDIS;
  });

  it('should initialize and register circuit breaker, bulkhead, and retry managers in container', async () => {
    await new ConfigInitializer(container).initialize();
    await new ObservabilityInitializer(container).initialize();
    await new InfrastructureInitializer(container).initialize();

    const initializer = new ResilienceInitializer(container);
    await initializer.initialize();

    expect(container.has('resilience')).toBe(true);
    expect(container.has('circuitBreakerManager')).toBe(true);
  });
});
