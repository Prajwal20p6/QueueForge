import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';
import { CacheStore } from '../../../src/infrastructure/cache/cache-store';
import { RedisOperations } from '../../../src/infrastructure/redis/redis-operations';
import { KeyBuilder } from '../../../src/infrastructure/redis/key-builder';

describe('cache-operations.integration', () => {
  let redis: any;
  let cacheStore: CacheStore;

  beforeAll(async () => {
    const stack = await setupIntegrationTestStack();
    redis = stack.redis;

    const logger = console as any;
    const ops = new RedisOperations(redis, logger);
    cacheStore = new CacheStore(ops, KeyBuilder, logger);
  });

  afterAll(async () => {
    await teardownIntegrationTestStack();
  });

  it('should write, read, check, and invalidate cache namespaces', async () => {
    const data = { sessionToken: 's-token-123' };
    await cacheStore.set('sessions', 'token1', data, 10000);

    const exists = await cacheStore.exists('sessions', 'token1');
    expect(exists).toBe(true);

    const retrieved = await cacheStore.get<typeof data>('sessions', 'token1');
    expect(retrieved).toEqual(data);

    await cacheStore.delete('sessions', 'token1');

    const checkMissing = await cacheStore.get('sessions', 'token1');
    expect(checkMissing).toBeNull();
  });
});
