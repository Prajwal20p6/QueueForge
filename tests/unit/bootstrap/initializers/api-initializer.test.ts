import { Container } from '../../../../src/bootstrap/container';
import { ConfigInitializer } from '../../../../src/bootstrap/initializers/config-initializer';
import { ObservabilityInitializer } from '../../../../src/bootstrap/initializers/observability-initializer';
import { InfrastructureInitializer } from '../../../../src/bootstrap/initializers/infrastructure-initializer';
import { DomainInitializer } from '../../../../src/bootstrap/initializers/domain-initializer';
import { ApplicationInitializer } from '../../../../src/bootstrap/initializers/application-initializer';
import { SecurityInitializer } from '../../../../src/bootstrap/initializers/security-initializer';
import { ResilienceInitializer } from '../../../../src/bootstrap/initializers/resilience-initializer';
import { ApiInitializer } from '../../../../src/bootstrap/initializers/api-initializer';

describe('ApiInitializer Unit Tests', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    process.env.MOCK_REDIS = 'true';
  });

  afterEach(() => {
    delete process.env.MOCK_REDIS;
  });

  it('should initialize and register API app instance in container', async () => {
    await new ConfigInitializer(container).initialize();
    await new ObservabilityInitializer(container).initialize();
    await new InfrastructureInitializer(container).initialize();
    await new DomainInitializer(container).initialize();
    await new ApplicationInitializer(container).initialize();
    await new SecurityInitializer(container).initialize();
    await new ResilienceInitializer(container).initialize();

    const initializer = new ApiInitializer(container);
    await initializer.initialize();

    expect(container.has('api')).toBe(true);
    expect(container.has('expressApp')).toBe(true);
  });
});
