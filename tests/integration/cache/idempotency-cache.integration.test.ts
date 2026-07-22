import Redis from 'ioredis';
import { IdempotencyCache } from '../../../src/infrastructure/cache/idempotency-cache';
import { getRedisClient } from '../../../src/infrastructure/redis/client';

describe('Idempotency Cache Integration', () => {
  let redis: Redis;
  let cache: IdempotencyCache;

  beforeEach(() => {
    redis = getRedisClient();
    cache = new IdempotencyCache(redis, {});
    jest.restoreAllMocks();
  });

  it('should successfully get and set cache entries with deserialization', async () => {
    const mockVal = { deliveryId: 'delivery-123' };
    let savedKey = '';
    let savedVal = '';
    let savedTTL = 0;

    jest.spyOn(redis, 'setex').mockImplementation(async (key: any, seconds: any, value: any) => {
      savedKey = key as string;
      savedTTL = Number(seconds);
      savedVal = value as string;
      return 'OK';
    });

    await cache.set('test-key', mockVal, 2);

    expect(savedKey).toBe('test-key');
    expect(savedTTL).toBe(2 * 3600); // 2 hours in seconds
    expect(JSON.parse(savedVal).value).toEqual(mockVal);

    jest.spyOn(redis, 'get').mockResolvedValue(savedVal);

    const retrieved = await cache.get('test-key');
    expect(retrieved).not.toBeNull();
    expect(retrieved!.value).toEqual(mockVal);
    expect(retrieved!.expiresAt).toBeInstanceOf(Date);
  });

  it('should verify key existence and handle missing keys correctly', async () => {
    jest.spyOn(redis, 'exists').mockResolvedValue(1);

    const exists = await cache.exists('exists-key');
    expect(exists).toBe(true);

    jest.spyOn(redis, 'get').mockResolvedValue(null);
    const retrieved = await cache.get('missing-key');
    expect(retrieved).toBeNull();
  });

  it('should delete a cached key successfully', async () => {
    jest.spyOn(redis, 'del').mockResolvedValue(1);

    await cache.delete('delete-key');
    expect(redis.del).toHaveBeenCalledWith('delete-key');
  });

  it('should clear all idempotency cache keys by prefix pattern', async () => {
    jest.spyOn(redis, 'keys').mockResolvedValue(['test:idempotent:key1', 'test:idempotent:key2']);
    jest.spyOn(redis, 'del').mockResolvedValue(2);

    await cache.clear();
    expect(redis.keys).toHaveBeenCalledWith('*idempotent*');
    expect(redis.del).toHaveBeenCalledWith('test:idempotent:key1', 'test:idempotent:key2');
  });
});
