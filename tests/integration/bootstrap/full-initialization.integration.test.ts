/**
 * Full Initialization Integration Test
 * Tests the complete dependency initialization pipeline in test environment using mocked infra.
 */
import { DependencyContainer } from '../../../src/bootstrap/dependencies';

jest.mock('../../../src/bootstrap/database-setup', () => ({
  setupDatabase: jest.fn().mockResolvedValue({
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    destination: { count: jest.fn().mockResolvedValue(0) },
    aiTaskResult: { count: jest.fn().mockResolvedValue(0) },
    taskResultDelivery: { count: jest.fn().mockResolvedValue(0) },
    $disconnect: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('../../../src/bootstrap/redis-setup', () => ({
  setupRedis: jest.fn().mockResolvedValue({
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue('OK'),
  }),
}));

jest.mock('../../../src/infrastructure/repositories', () => ({
  initializeRepositories: jest.fn().mockResolvedValue({
    results: {},
    deliveries: {},
    destinations: {},
    attempts: {},
    auditLogs: {},
  }),
}));

jest.mock('../../../src/bootstrap/queue-setup', () => ({
  setupQueue: jest.fn().mockResolvedValue({
    getMainQueue: jest.fn().mockReturnValue({ getJobCounts: jest.fn().mockResolvedValue({}) }),
    getDelayedQueue: jest.fn().mockReturnValue({ getJobCounts: jest.fn().mockResolvedValue({}) }),
    getDLQ: jest.fn().mockReturnValue({ getJobCounts: jest.fn().mockResolvedValue({}) }),
  }),
}));

jest.mock('../../../src/bootstrap/observability-setup', () => ({
  setupObservability: jest.fn().mockResolvedValue({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
    tracer: { shutdown: jest.fn() },
    metrics: { getMeter: jest.fn() },
    audit: {},
  }),
}));

jest.mock('../../../src/bootstrap/security-setup', () => ({
  setupSecurity: jest.fn().mockResolvedValue({
    jwtStrategy: {},
    apiKeyStrategy: {},
    authGuard: {},
    validator: {},
    signer: {},
    verifier: {},
    rateLimiter: {},
    secretsManager: {},
  }),
}));

jest.mock('../../../src/bootstrap/resilience-setup', () => ({
  setupResilience: jest.fn().mockResolvedValue({ circuitBreaker: {}, bulkhead: {}, backpressure: {}, retry: {} }),
}));

jest.mock('../../../src/application/services', () => ({
  createServiceContainer: jest.fn().mockReturnValue({ ingestResult: {}, validateResult: {} }),
}));

jest.mock('../../../src/infrastructure/cache/idempotency-cache', () => ({
  IdempotencyCache: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../../src/bootstrap/worker-setup', () => ({ setupWorker: jest.fn().mockResolvedValue(null) }));
jest.mock('../../../src/bootstrap/daemon-setup', () => ({ setupDaemon: jest.fn().mockResolvedValue(null) }));
jest.mock('../../../src/bootstrap/api-setup', () => ({
  setupApi: jest.fn().mockResolvedValue({ use: jest.fn(), listen: jest.fn() }),
}));

jest.mock('../../../src/infrastructure/database/client', () => ({
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

describe('Full Initialization Integration Tests', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const mockConfig = {
    app: { name: 'QueueForge', environment: 'test', nodeEnv: 'test', port: 3000 },
    observability: { logLevel: 'info' },
    security: { jwtSecret: 'a'.repeat(32) },
    redis: {},
    queue: {},
  } as any;

  it('should complete full initialization and expose all getters', async () => {
    const container = new DependencyContainer(mockConfig, mockLogger as any);
    await container.initialize();

    expect(container.getConfig()).toBe(mockConfig);
    expect(container.getLogger()).toBeDefined();
    expect(container.getPrisma()).toBeDefined();
    expect(container.getRedis()).toBeDefined();
    expect(container.getQueueManager()).toBeDefined();
    expect(container.getObservability()).toBeDefined();
    expect(container.getSecurity()).toBeDefined();
    expect(container.getResilience()).toBeDefined();
  });

  it('should allow subsequent shutdown without errors', async () => {
    const container = new DependencyContainer(mockConfig, mockLogger as any);
    await container.initialize();
    await expect(container.shutdown()).resolves.not.toThrow();
  });

  it('should return null for worker and daemon in test mode', async () => {
    const container = new DependencyContainer(mockConfig, mockLogger as any);
    await container.initialize();
    expect(container.getWorker()).toBeNull();
    expect(container.getDaemon()).toBeNull();
  });
});
