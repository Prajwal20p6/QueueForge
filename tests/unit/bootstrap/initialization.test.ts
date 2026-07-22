import { initializeApplication } from '../../../src/bootstrap/initialization';

// Mock all heavy dependencies
jest.mock('../../../src/bootstrap/logger-setup', () => ({
  setupLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

const mockContainerInstance = {
  initialize: jest.fn().mockResolvedValue(undefined),
  shutdown: jest.fn().mockResolvedValue(undefined),
  getApi: jest.fn().mockReturnValue({ use: jest.fn() }),
  getPrisma: jest.fn().mockReturnValue({
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    destination: { count: jest.fn().mockResolvedValue(0) },
    aiTaskResult: { count: jest.fn().mockResolvedValue(0) },
    taskResultDelivery: { count: jest.fn().mockResolvedValue(0) },
  }),
  getRedis: jest.fn().mockReturnValue({
    ping: jest.fn().mockResolvedValue('PONG'),
  }),
  getQueueManager: jest.fn().mockReturnValue({
    getMainQueue: jest.fn().mockReturnValue({ getJobCounts: jest.fn().mockResolvedValue({}) }),
  }),
  getObservability: jest.fn().mockReturnValue({
    metrics: {},
    tracer: { shutdown: jest.fn() },
  }),
  getLogger: jest.fn().mockReturnValue({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
  setServer: jest.fn(),
};

jest.mock('../../../src/bootstrap/dependencies', () => ({
  DependencyContainer: jest.fn().mockImplementation(() => mockContainerInstance),
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
  createServer: jest.fn().mockReturnValue({ listen: jest.fn(), close: jest.fn() }),
}));

describe('initializeApplication Unit Tests', () => {
  const mockConfig = {
    app: { name: 'QueueForge', environment: 'test', port: 3000, nodeEnv: 'test' },
    security: { jwtSecret: 'a'.repeat(32) },
  } as any;

  beforeEach(() => jest.clearAllMocks());

  it('should return container, app, and server on success', async () => {
    const { container, app, server } = await initializeApplication(mockConfig);
    expect(container).toBeDefined();
    expect(app).toBeDefined();
    expect(server).toBeDefined();
  });

  it('should call container.initialize()', async () => {
    await initializeApplication(mockConfig);
    expect(mockContainerInstance.initialize).toHaveBeenCalled();
  });

  it('should throw if getApi() returns null', async () => {
    mockContainerInstance.getApi.mockReturnValueOnce(null);
    await expect(initializeApplication(mockConfig)).rejects.toThrow();
  });
});
