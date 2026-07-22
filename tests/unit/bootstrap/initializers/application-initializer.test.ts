import { Container } from '../../../../src/bootstrap/container';
import { ConfigInitializer } from '../../../../src/bootstrap/initializers/config-initializer';
import { ObservabilityInitializer } from '../../../../src/bootstrap/initializers/observability-initializer';
import { InfrastructureInitializer } from '../../../../src/bootstrap/initializers/infrastructure-initializer';
import { DomainInitializer } from '../../../../src/bootstrap/initializers/domain-initializer';
import { ApplicationInitializer } from '../../../../src/bootstrap/initializers/application-initializer';

describe('ApplicationInitializer Unit Tests', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    process.env.MOCK_REDIS = 'true';
  });

  afterEach(() => {
    delete process.env.MOCK_REDIS;
  });

  it('should initialize and register application use cases in container', async () => {
    await new ConfigInitializer(container).initialize();
    await new ObservabilityInitializer(container).initialize();
    await new InfrastructureInitializer(container).initialize();
    await new DomainInitializer(container).initialize();

    const initializer = new ApplicationInitializer(container);
    await initializer.initialize();

    expect(container.has('application')).toBe(true);
    expect(container.has('ingestResultService')).toBe(true);
    expect(container.has('processDeliveryService')).toBe(true);
  });
});
