import { Container } from '../container';
import { initializeInfrastructureModule } from '../../infrastructure';

/**
 * Initializer setting up PostgreSQL connection pool, Redis cache & lock clients, and BullMQ queue manager.
 */
export class InfrastructureInitializer {
  constructor(private readonly container: Container) {}

  public async initialize(): Promise<void> {
    const config = this.container.get('config');
    const logger = this.container.get('logger');

    const infraContext: any = await initializeInfrastructureModule(config, logger);

    this.container.register('infrastructure', () => infraContext);
    this.container.register('repositories', () => infraContext.repositories);
    this.container.register('redisClient', () => infraContext.redis?.client || infraContext.redis?.redisClient);
    this.container.register('redisOperations', () => infraContext.redis?.operations || infraContext.redis?.redisOperations);
    this.container.register('queueManager', () => infraContext.queue?.queueManager || infraContext.queue?.manager || infraContext.queue);
    this.container.register('connectionPool', () => infraContext.database?.connectionPool || infraContext.database?.prisma);
  }
}
