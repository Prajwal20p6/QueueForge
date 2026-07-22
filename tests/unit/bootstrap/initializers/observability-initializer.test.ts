import { Container } from '../../../../src/bootstrap/container';
import { ObservabilityInitializer } from '../../../../src/bootstrap/initializers/observability-initializer';

describe('ObservabilityInitializer Unit Tests', () => {
  let container: Container;
  let initializer: ObservabilityInitializer;

  beforeEach(() => {
    container = new Container();
    initializer = new ObservabilityInitializer(container);
  });

  it('should initialize and register observability components in container', async () => {
    await initializer.initialize();

    expect(container.has('observability')).toBe(true);
    expect(container.has('tracer')).toBe(true);
    expect(container.has('logger')).toBe(true);
    expect(container.has('metrics')).toBe(true);
    expect(container.has('auditLogger')).toBe(true);
  });
});
