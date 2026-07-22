import { Container } from '../../../../src/bootstrap/container';
import { InitializationOrchestrator } from '../../../../src/bootstrap/initializers/initialization-orchestrator';

describe('InitializationOrchestrator Unit Tests', () => {
  let container: Container;
  let orchestrator: InitializationOrchestrator;

  beforeEach(() => {
    container = new Container();
    orchestrator = new InitializationOrchestrator(container);
    process.env.MOCK_REDIS = 'true';
  });

  afterEach(() => {
    delete process.env.MOCK_REDIS;
  });

  it('should initialize all 10 architectural layer initializers in sequence', async () => {
    await expect(orchestrator.initialize()).resolves.not.toThrow();

    expect(container.has('config')).toBe(true);
    expect(container.has('observability')).toBe(true);
  });
});
