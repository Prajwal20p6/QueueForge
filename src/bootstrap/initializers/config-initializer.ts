import { Container } from '../container';
import { getConfig } from '../../config';

/**
 * Initializer loading, validating, and registering system configuration settings in DI container.
 */
export class ConfigInitializer {
  constructor(private readonly container: Container) {}

  public async initialize(): Promise<void> {
    const config = getConfig();

    this.container.register('config', () => config);
    this.container.register('app.config', () => config.app);
    this.container.register('database.config', () => config.database);
    this.container.register('redis.config', () => config.redis);
    this.container.register('queue.config', () => config.queue);
    this.container.register('security.config', () => config.security);
    this.container.register('resilience.config', () => config.resilience);
    this.container.register('api.config', () => (config as any).api || (config as any).server);
    this.container.register('observability.config', () => (config as any).observability);
    this.container.register('daemon.config', () => (config as any).daemon);
    this.container.register('worker.config', () => (config as any).worker);
  }
}
