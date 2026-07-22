import {
  initializeRedis,
  disconnectRedis,
  getConnectionStatus,
  getStats,
} from '../../../src/infrastructure/redis/client';
import { InfrastructureError } from '../../../src/shared/errors/infrastructure-error';

const mockPing = jest.fn().mockResolvedValue('PONG');
const mockInfo = jest.fn().mockResolvedValue(
  '# Clients\r\nconnected_clients:2\r\n# Memory\r\nused_memory_human:1.20M\r\n# Stats\r\ninstantaneous_ops_per_sec:15'
);

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    status: 'ready',
    connect: jest.fn().mockResolvedValue(undefined),
    ping: mockPing,
    info: mockInfo,
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn(),
    on: jest.fn(),
    options: { host: 'localhost', port: 6379, db: 0 },
  }));
});

jest.mock('../../../src/config', () => ({
  getConfig: () => ({
    redis: {
      host: 'localhost',
      port: 6379,
      db: 0,
      password: 'password',
      connectionTimeout: 500,
      maxRetriesOnConnectionFailure: 2,
      retryDelayMs: 10,
      enableTLS: false,
    },
    app: {
      nodeEnv: 'test',
    },
  }),
}));

describe('Redis Client Integration', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await disconnectRedis();
    mockPing.mockResolvedValue('PONG');
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  it('should establish connection successfully and return stats and status', async () => {
    const initClient = await initializeRedis();
    expect(initClient).toBeDefined();

    const status = await getConnectionStatus();
    expect(status.isConnected).toBe(true);

    const stats = await getStats();
    expect(stats.connectedClients).toBe(2);
    expect(stats.usedMemory).toBe('1.20M');
    expect(stats.ops).toBe(15);
  });

  it('should throw InfrastructureError when ping fails on initialization', async () => {
    mockPing.mockRejectedValue(new Error('Connection lost'));

    await expect(initializeRedis()).rejects.toThrow(InfrastructureError);

    const status = await getConnectionStatus();
    expect(status.isConnected).toBe(false);
  });
});
