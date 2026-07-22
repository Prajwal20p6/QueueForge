import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';
import { RedisConnectionPool, ConnectionStatus } from '../../../src/infrastructure/redis/connection-pool';
import { getConfig } from '../../../src/config';

describe('redis-connection.integration', () => {
  beforeAll(async () => {
    await setupIntegrationTestStack();
  });

  afterAll(async () => {
    await teardownIntegrationTestStack();
  });

  it('should verify connected status and run connection pool ping checks', async () => {
    const config = getConfig();
    const logger = console as any;
    const pool = new RedisConnectionPool(config.redis, logger);

    const stats = pool.getStats();
    expect(stats.connected).toBe(true);

    const status = pool.getConnectionStatus();
    expect(status).toBe(ConnectionStatus.CONNECTED);

    const isHealthy = pool.isHealthy();
    expect(isHealthy).toBe(true);
  });
});
