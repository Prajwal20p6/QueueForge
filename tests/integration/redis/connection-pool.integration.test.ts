import { RedisPoolManager } from '../../../src/infrastructure/redis/connection-pool';
import { getRedisClient } from '../../../src/infrastructure/redis/client';

describe('Redis Connection Pool Manager Integration', () => {
  let redis: any;
  let config: any;

  beforeEach(() => {
    redis = getRedisClient();
    config = {
      redis: {
        poolMax: 10,
      },
    };
    jest.restoreAllMocks();
  });

  it('should verify pool health and retrieve statistics successfully', async () => {
    jest.spyOn(redis, 'ping').mockResolvedValue('PONG');
    jest.spyOn(redis, 'info').mockResolvedValue('# Clients\r\nconnected_clients:5\r\n');

    const manager = new RedisPoolManager(redis, config);
    const health = await manager.checkHealth();

    expect(health).toBe(true);

    const stats = manager.getStats();
    expect(stats.activeConnections).toBe(5);
    expect(stats.totalConnections).toBe(5);

    manager.stopMonitoring();
  });

  it('should handle redis errors gracefully on healthchecks', async () => {
    jest.spyOn(redis, 'ping').mockRejectedValue(new Error('Redis is down'));

    const manager = new RedisPoolManager(redis, config);
    const health = await manager.checkHealth();

    expect(health).toBe(false);

    manager.stopMonitoring();
  });
});
