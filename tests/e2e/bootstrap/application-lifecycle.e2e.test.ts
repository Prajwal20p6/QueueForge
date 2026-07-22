/**
 * Application Lifecycle E2E Test
 * Verifies full startup → running → graceful shutdown lifecycle without actual infrastructure.
 */
import { initializeApplication } from '../../../src/bootstrap/initialization';
import { gracefulShutdown } from '../../../src/bootstrap/shutdown';

jest.mock('../../../src/bootstrap/logger-setup', () => ({
  setupLogger: jest.fn().mockReturnValue({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
  }),
}));

const mockContainer = {
  initialize: jest.fn().mockResolvedValue(undefined),
  shutdown: jest.fn().mockResolvedValue(undefined),
  getApi: jest.fn().mockReturnValue({ use: jest.fn() }),
  getPrisma: jest.fn().mockReturnValue({
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    destination: { count: jest.fn().mockResolvedValue(0) },
    aiTaskResult: { count: jest.fn().mockResolvedValue(0) },
    taskResultDelivery: { count: jest.fn().mockResolvedValue(0) },
  }),
  getRedis: jest.fn().mockReturnValue({ ping: jest.fn().mockResolvedValue('PONG') }),
  getQueueManager: jest.fn().mockReturnValue({
    getMainQueue: jest.fn().mockReturnValue({ getJobCounts: jest.fn().mockResolvedValue({}) }),
  }),
  getObservability: jest.fn().mockReturnValue({
    metrics: {},
    tracer: { shutdown: jest.fn() },
  }),
  getLogger: jest.fn().mockReturnValue({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
  }),
  setServer: jest.fn(),
};

jest.mock('../../../src/bootstrap/dependencies', () => ({
  DependencyContainer: jest.fn().mockImplementation(() => mockContainer),
}));

jest.mock('../../../src/bootstrap/startup-validation', () => ({
  StartupValidator: jest.fn().mockImplementation(() => ({
    validate: jest.fn().mockResolvedValue({ isValid: true, errors: [], warnings: [] }),
  })),
}));

jest.mock('../../../src/bootstrap/health-check-startup', () => ({
  waitForHealthy: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../src/bootstrap/startup-summary', () => ({
  logStartupSummary: jest.fn(),
}));

jest.mock('http', () => ({
  createServer: jest.fn().mockReturnValue({
    listen: jest.fn(),
    close: jest.fn().mockImplementation((cb?: (err?: Error) => void) => { if (cb) cb(); }),
  }),
}));

const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
  throw new Error(`process.exit(${code})`);
});

describe('Application Lifecycle E2E Tests', () => {
  const mockConfig = {
    app: { name: 'QueueForge', environment: 'test', nodeEnv: 'test', port: 3000 },
    security: { jwtSecret: 'a'.repeat(32) },
  } as any;

  afterEach(() => jest.clearAllMocks());
  afterAll(() => mockExit.mockRestore());

  it('should start the application and return a valid context', async () => {
    const { container, app, server } = await initializeApplication(mockConfig);

    expect(container).toBeDefined();
    expect(app).toBeDefined();
    expect(server).toBeDefined();

    expect(mockContainer.initialize).toHaveBeenCalled();
    expect(mockContainer.getApi).toHaveBeenCalled();
  });

  it('should complete graceful shutdown after startup', async () => {
    const { container, server } = await initializeApplication(mockConfig);
    const logger = container.getLogger();

    await expect(
      gracefulShutdown(container, server, logger, 5000)
    ).rejects.toThrow('process.exit(0)');

    expect(mockContainer.shutdown).toHaveBeenCalled();
  });

  it('should log startup summary after initialization', async () => {
    const { logStartupSummary } = require('../../../src/bootstrap/startup-summary');
    await initializeApplication(mockConfig);
    expect(logStartupSummary).toHaveBeenCalled();
  });
});
