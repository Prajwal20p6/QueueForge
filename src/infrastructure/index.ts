import { initializeDatabaseModule, DatabaseModule } from './database.module';
import { initializeRedisModule, RedisModule } from './redis/redis.module';
import { initializeQueueModule, QueueModule } from './queue/queue.module';
import { initializeCacheModule, CacheModule } from './cache/cache.module';

export * from './database';
export { PoolStats } from './database';
export * from './repositories';
export * from './database.module';
export * from './redis';
export * from './queue';
export * from './cache';

export interface InfrastructureModule {
  database: DatabaseModule;
  redis: RedisModule;
  queue: QueueModule;
  cache: CacheModule;
  repositories: any;
}

export async function initializeInfrastructureModule(config?: any, logger?: any): Promise<InfrastructureModule> {
  const dbConfig = config?.database || config;
  const redisConfig = config?.redis || config;
  const queueConfig = config?.queue || config;

  const db = await initializeDatabaseModule(dbConfig, logger);
  const redis = await initializeRedisModule(redisConfig, logger);
  const queue = await initializeQueueModule(queueConfig, redis, db.repositories, logger, (logger as any)?.observability);
  const cache = await initializeCacheModule(redis, logger);

  return {
    database: db,
    redis,
    queue,
    cache,
    repositories: db.repositories,
  };
}
