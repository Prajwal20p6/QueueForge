import { Container } from '../../../../src/bootstrap/container';
import { ConfigInitializer } from '../../../../src/bootstrap/initializers/config-initializer';
import { ObservabilityInitializer } from '../../../../src/bootstrap/initializers/observability-initializer';
import { InfrastructureInitializer } from '../../../../src/bootstrap/initializers/infrastructure-initializer';
import { SecurityInitializer } from '../../../../src/bootstrap/initializers/security-initializer';

describe('SecurityInitializer Unit Tests', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    process.env.MOCK_REDIS = 'true';
  });

  afterEach(() => {
    delete process.env.MOCK_REDIS;
  });

  it('should initialize and register security guards and strategies in container', async () => {
    await new ConfigInitializer(container).initialize();
    await new ObservabilityInitializer(container).initialize();
    await new InfrastructureInitializer(container).initialize();

    const initializer = new SecurityInitializer(container);
    await initializer.initialize();

    expect(container.has('security')).toBe(true);
    expect(container.has('authGuard')).toBe(true);
  });
});
