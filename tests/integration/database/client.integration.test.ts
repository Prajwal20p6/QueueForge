import {
  initializeDatabase,
  disconnectDatabase,
  getConnectionStatus,
  withTransaction,
  getPrismaClient,
} from '../../../src/infrastructure/database/client';
import { InfrastructureError } from '../../../src/shared/errors/infrastructure-error';

jest.mock('../../../src/config', () => ({
  getConfig: () => ({
    database: {
      url: 'postgresql://postgres:postgres@localhost:5432/queueforge_test',
      enableLogging: false,
      retryAttempts: 2,
      retryDelay: 10,
      poolMax: 10,
    },
    app: {
      nodeEnv: 'test',
    },
  }),
}));

describe('Database Client Integration', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should establish connection successfully and return status', async () => {
    const prisma = getPrismaClient();
    jest.spyOn(prisma, '$queryRaw').mockResolvedValue([{ '?column?': 1 }]);

    const client = await initializeDatabase();
    expect(client).toBe(prisma);

    const status = await getConnectionStatus();
    expect(status.isConnected).toBe(true);
    expect(status.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('should fail initialization and throw InfrastructureError on db failure', async () => {
    const prisma = getPrismaClient();
    jest.spyOn(prisma, '$queryRaw').mockRejectedValue(new Error('Connection timeout'));

    await expect(initializeDatabase()).rejects.toThrow(InfrastructureError);

    const status = await getConnectionStatus();
    expect(status.isConnected).toBe(false);
  });

  it('should execute transaction successfully using withTransaction wrapper', async () => {
    const prisma = getPrismaClient();
    jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
      return cb(prisma);
    });

    const result = await withTransaction(async _tx => {
      return 'tx-result';
    });

    expect(result).toBe('tx-result');
  });
});
