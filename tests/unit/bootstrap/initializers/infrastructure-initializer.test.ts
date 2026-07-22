import { Container } from '../../../../src/bootstrap/container';
import { ConfigInitializer } from '../../../../src/bootstrap/initializers/config-initializer';
import { ObservabilityInitializer } from '../../../../src/bootstrap/initializers/observability-initializer';
import { InfrastructureInitializer } from '../../../../src/bootstrap/initializers/infrastructure-initializer';

describe('InfrastructureInitializer Unit Tests', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    process.env.MOCK_REDIS = 'true';
  });

  afterEach(() => {
    delete process.env.MOCK_REDIS;
  });

  it('should initialize and register infrastructure dependencies in container', async () => {
    await new ConfigInitializer(container).initialize();
    await new ObservabilityInitializer(container).initialize();

    const initializer = new InfrastructureInitializer(container);
    await initializer.initialize();

    expect(container.has('infrastructure')).toBe(true);
    expect(container.has('repositories')).toBe(true);
    expect(container.has('redisClient')).toBe(true);
    expect(container.has('redisOperations')).toBe(true);
    expect(container.has('queueManager')).toBe(true);
    expect(container.has('connectionPool')).toBe(true);
  });
});
