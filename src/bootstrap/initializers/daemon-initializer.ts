import { Container } from '../container';
import { initializeDaemonModule } from '../../daemon';

/**
 * Initializer orchestrating recovery, health-monitoring, and metrics collection background daemons.
 */
export class DaemonInitializer {
  constructor(private readonly container: Container) {}

  public async initialize(): Promise<void> {
    const config = this.container.get('config');
    const application = this.container.get('application');
    const redisOps = this.container.get('redisOperations');
    const queueManager = this.container.get('queueManager');
    const logger = this.container.get('logger');
    const observability = this.container.get('observability');

    const daemonModule = await initializeDaemonModule(config, {
      services: application,
      redisModule: { redis: redisOps },
      queueManager,
      logger,
      observability,
    });

    this.container.register('daemon', () => daemonModule);
    this.container.register('daemonCoordinator', () => daemonModule.coordinator);
    this.container.register('recoveryDaemon', () => daemonModule.daemons?.recovery);
    this.container.register('healthDaemon', () => daemonModule.daemons?.health);
    this.container.register('metricsDaemon', () => daemonModule.daemons?.metrics);
  }
}
