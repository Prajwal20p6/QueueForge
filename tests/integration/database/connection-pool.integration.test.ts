import { ConnectionPoolManager } from '../../../src/infrastructure/database/connection-pool';
import { getPrismaClient } from '../../../src/infrastructure/database/client';

describe('Database Connection Pool Integration', () => {
  let prisma: any;
  let config: any;

  beforeEach(() => {
    prisma = getPrismaClient();
    config = {
      database: {
        poolMax: 10,
      },
    };
    jest.restoreAllMocks();
  });

  it('should collect metrics and start monitoring', async () => {
    jest.spyOn(prisma, '$queryRaw').mockResolvedValue([{ '?column?': 1 }]);
    Object.defineProperty(prisma, '$metrics', {
      value: {
        json: jest.fn().mockResolvedValue({
          gauges: [
            { key: 'prisma_client_database_connections_active', value: 3 },
            { key: 'prisma_client_database_connections_idle', value: 2 },
            { key: 'prisma_client_database_connections_open', value: 5 },
          ],
          counters: [],
          histograms: [],
        }),
      },
      configurable: true,
      writable: true,
    });

    const manager = new ConnectionPoolManager(prisma, config);
    const health = await manager.checkHealth();

    expect(health).toBe(true);
    const stats = manager.getStats();
    expect(stats.activeConnections).toBe(3);
    expect(stats.idleConnections).toBe(2);
    expect(stats.totalConnections).toBe(5);

    manager.stopMonitoring();
  });

  it('should trigger onLowConnections callback when utilization is high', async () => {
    jest.spyOn(prisma, '$queryRaw').mockResolvedValue([{ '?column?': 1 }]);
    Object.defineProperty(prisma, '$metrics', {
      value: {
        json: jest.fn().mockResolvedValue({
          gauges: [
            { key: 'prisma_client_database_connections_active', value: 9 }, // 90% utilization
            { key: 'prisma_client_database_connections_idle', value: 0 },
            { key: 'prisma_client_database_connections_open', value: 9 },
          ],
          counters: [],
          histograms: [],
        }),
      },
      configurable: true,
      writable: true,
    });

    const manager = new ConnectionPoolManager(prisma, config);
    const callback = jest.fn();
    manager.onLowConnections(callback);

    await manager.checkHealth();
    expect(callback).toHaveBeenCalled();

    manager.stopMonitoring();
  });
});
