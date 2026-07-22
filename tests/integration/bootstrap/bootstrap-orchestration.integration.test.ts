import { Container } from '../../../src/bootstrap/container';
import { InitializationOrchestrator } from '../../../src/bootstrap/initializers/initialization-orchestrator';

describe('Bootstrap Orchestration Integration Test', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  it('should run full initialization orchestrator end-to-end and wire all 10 layers', async () => {
    const orchestrator = new InitializationOrchestrator(container);
    await expect(orchestrator.initialize()).resolves.not.toThrow();

    expect(container.has('config')).toBe(true);
    expect(container.has('observability')).toBe(true);
    expect(container.has('infrastructure')).toBe(true);
    expect(container.has('application')).toBe(true);
    expect(container.has('security')).toBe(true);
    expect(container.has('resilience')).toBe(true);
    expect(container.has('api')).toBe(true);
    expect(container.has('worker')).toBe(true);
    expect(container.has('daemon')).toBe(true);
  });
});
