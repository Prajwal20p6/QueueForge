import { Container } from '../../src/bootstrap/container';
import { InitializationOrchestrator } from '../../src/bootstrap/initializers/initialization-orchestrator';

export class IntegrationTestSetup {
  public static async setupFullStack(): Promise<Container> {
    const container = new Container();
    const orchestrator = new InitializationOrchestrator(container);
    await orchestrator.initialize();
    return container;
  }
}
