import { DependencyContainer } from '../../../src/bootstrap/dependencies';

// All heavy infrastructure modules are mocked
jest.mock('../../../src/bootstrap/database-setup', () => ({
  setupDatabase: jest.fn().mockResolvedValue({
    $queryRaw: jest.fn(),
    destination: { count: jest.fn() },
    aiTaskResult: { count: jest.fn() },
    taskResultDelivery: { count: jest.fn() },
    $disconnect: jest.fn(),
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
    tracer: { initialize: jest.fn(), shutdown: jest.fn() },
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
  setupResilience: jest.fn().mockResolvedValue({
    circuitBreaker: {},
    bulkhead: {},
    backpressure: {},
    retry: {},
  }),
}));

jest.mock('../../../src/application/services', () => ({
  createServiceContainer: jest.fn().mockReturnValue({
    ingestResult: {},
    validateResult: {},
  }),
}));

jest.mock('../../../src/infrastructure/cache/idempotency-cache', () => ({
  IdempotencyCache: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../../src/bootstrap/worker-setup', () => ({
  setupWorker: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../../src/bootstrap/daemon-setup', () => ({
  setupDaemon: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../../src/bootstrap/api-setup', () => ({
  setupApi: jest.fn().mockResolvedValue({ use: jest.fn(), listen: jest.fn() }),
}));

jest.mock('../../../src/infrastructure/database/client', () => ({
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

describe('DependencyContainer Unit Tests', () => {
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

  it('should initialize successfully and set initialized flag', async () => {
    const container = new DependencyContainer(mockConfig, mockLogger as any);
    await container.initialize();
    expect(container.getConfig()).toBe(mockConfig);
    expect(container.getLogger()).toBe(mockLogger);
  });

  it('should skip second initialize call', async () => {
    const container = new DependencyContainer(mockConfig, mockLogger as any);
    await container.initialize();
    await container.initialize(); // second call
    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[DependencyContainer] Dependencies already initialized.'
    );
  });

  it('should shutdown cleanly without errors', async () => {
    const container = new DependencyContainer(mockConfig, mockLogger as any);
    await container.initialize();
    await container.shutdown();
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Graceful shutdown process finalized')
    );
  });

  it('should handle shutdown when not initialized', async () => {
    const container = new DependencyContainer(mockConfig, mockLogger as any);
    await container.shutdown();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[DependencyContainer] Dependencies are not initialized. Skipping shutdown.'
    );
  });
});
