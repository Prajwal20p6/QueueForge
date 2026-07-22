import { CacheStore } from '../../../../src/infrastructure/cache/cache-store';
import { RedisOperations } from '../../../../src/infrastructure/redis/redis-operations';
import { KeyBuilder } from '../../../../src/infrastructure/redis/key-builder';
import { Logger } from 'winston';

describe('cache-store Unit Tests', () => {
  let mockRedisOps: jest.Mocked<RedisOperations>;
  let logger: Logger;
  let store: CacheStore;

  beforeEach(() => {
    mockRedisOps = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      ttl: jest.fn(),
      expire: jest.fn(),
      increment: jest.fn(),
      decrement: jest.fn(),
      deleteByPattern: jest.fn(),
    } as any;
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;
    store = new CacheStore(mockRedisOps, KeyBuilder, logger);
  });

  it('should set, get, exists, and delete from namespace cache', async () => {
    const valueObj = { foo: 'bar' };
    mockRedisOps.get.mockResolvedValue(JSON.stringify(valueObj));
    mockRedisOps.exists.mockResolvedValue(true);

    await store.set('users', '1', valueObj, 5000);
    expect(mockRedisOps.set).toHaveBeenCalledWith('queueforge:cache:users:1', JSON.stringify(valueObj), 5000);

    const cached = await store.get<{ foo: string }>('users', '1');
    expect(cached).toEqual(valueObj);

    const exists = await store.exists('users', '1');
    expect(exists).toBe(true);

    await store.delete('users', '1');
    expect(mockRedisOps.delete).toHaveBeenCalledWith('queueforge:cache:users:1');
  });

  it('should fetch fresh values on cache miss in getOrFetch', async () => {
    mockRedisOps.get.mockResolvedValue(null);
    const fetcher = jest.fn().mockResolvedValue('fresh-data');

    const data = await store.getOrFetch('items', '1', fetcher, 1000);
    expect(data).toBe('fresh-data');
    expect(fetcher).toHaveBeenCalled();
    expect(mockRedisOps.set).toHaveBeenCalled();
  });
});
