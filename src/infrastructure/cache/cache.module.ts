import { Logger } from 'winston';
import { RedisModule } from '../redis/redis.module';
import { CacheStore } from './cache-store';
import { TTLManager } from './ttl-manager';

export interface CacheModule {
  store: CacheStore;
  ttlManager: TTLManager;
}

/**
 * Initializes the Caching infrastructure module, including stores and cleaners.
 */
export async function initializeCacheModule(
  redisModule: RedisModule,
  logger: Logger
): Promise<CacheModule> {
  logger.info('[CacheModule] Initializing Cache Module...');

  const store = new CacheStore(redisModule.operations, redisModule.keyBuilder, logger);
  const ttlManager = new TTLManager(redisModule.operations, logger);

  logger.info('[CacheModule] Cache Module initialized successfully.');

  return {
    store,
    ttlManager,
  };
}
