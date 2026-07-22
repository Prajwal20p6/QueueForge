import { Container } from '../../../../src/bootstrap/container';
import { ConfigInitializer } from '../../../../src/bootstrap/initializers/config-initializer';

describe('ConfigInitializer Unit Tests', () => {
  let container: Container;
  let initializer: ConfigInitializer;

  beforeEach(() => {
    container = new Container();
    initializer = new ConfigInitializer(container);
  });

  it('should register all configuration sub-objects into container', async () => {
    await initializer.initialize();

    expect(container.has('config')).toBe(true);
    expect(container.has('app.config')).toBe(true);
    expect(container.has('database.config')).toBe(true);
    expect(container.has('redis.config')).toBe(true);
    expect(container.has('queue.config')).toBe(true);
    expect(container.has('security.config')).toBe(true);
    expect(container.has('resilience.config')).toBe(true);
  });
});
