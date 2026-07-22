import { RedisOperations } from '../../../../src/infrastructure/redis/redis-operations';
import { Logger } from 'winston';
import { InfrastructureError } from '../../../../src/shared/errors/infrastructure-error';

describe('redis-operations Unit Tests', () => {
  let mockRedis: any;
  let ops: RedisOperations;
  let logger: Logger;

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      ttl: jest.fn(),
      pexpire: jest.fn(),
      incrby: jest.fn(),
      decrby: jest.fn(),
      lpush: jest.fn(),
      lpop: jest.fn(),
      sadd: jest.fn(),
      zadd: jest.fn(),
      zrangebyscore: jest.fn(),
      hset: jest.fn(),
      hget: jest.fn(),
      hgetall: jest.fn(),
      ping: jest.fn(),
      keys: jest.fn(),
    };
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;
    ops = new RedisOperations(mockRedis, logger);
  });

  it('should wrap execution errors in InfrastructureError', async () => {
    mockRedis.get.mockRejectedValue(new Error('Connection lost'));
    await expect(ops.get('any-key')).rejects.toThrow(InfrastructureError);
  });

  it('should set, get, exists, and delete keys successfully', async () => {
    mockRedis.get.mockResolvedValue('val');
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.exists.mockResolvedValue(1);
    mockRedis.del.mockResolvedValue(1);

    const val = await ops.get('key');
    expect(val).toBe('val');

    await ops.set('key', 'val', 100);
    expect(mockRedis.set).toHaveBeenCalledWith('key', 'val', 'PX', 100);

    const exists = await ops.exists('key');
    expect(exists).toBe(true);

    const deleted = await ops.delete('key');
    expect(deleted).toBe(true);
  });

  it('should run sadd and hgetall successfully', async () => {
    mockRedis.sadd.mockResolvedValue(1);
    mockRedis.hgetall.mockResolvedValue({ f1: 'v1' });

    const added = await ops.sadd('set-key', ['v1']);
    expect(added).toBe(1);

    const h = await ops.hgetall('hash-key');
    expect(h).toEqual({ f1: 'v1' });
  });
});
