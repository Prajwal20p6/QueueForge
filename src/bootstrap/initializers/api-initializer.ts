import { Container } from '../container';
import { initializeApiModule } from '../../api';

/**
 * Initializer mounting REST endpoints, webhooks, middleware pipelines, and Express application instance.
 */
export class ApiInitializer {
  constructor(private readonly container: Container) {}

  public async initialize(): Promise<void> {
    const config = this.container.get('config');
    const application = this.container.get('application');
    const security = this.container.get('security');
    const resilience = this.container.get('resilience');
    const logger = this.container.get('logger');
    const observability = this.container.get('observability');

    const apiModule = await initializeApiModule(
      config,
      { application, security, resilience },
      logger,
      observability
    );

    this.container.register('api', () => apiModule);
    this.container.register('expressApp', () => apiModule.app);
    this.container.register('app', () => apiModule.app);
  }
}
