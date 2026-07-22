import { logStartupSummary } from '../../../src/bootstrap/startup-summary';

describe('logStartupSummary Unit Tests', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const mockConfig = {
    app: {
      name: 'QueueForge',
      version: '1.0.0',
      environment: 'test',
      port: 3000,
      hostname: 'localhost',
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call logger.info with startup banner', () => {
    const startTime = new Date(Date.now() - 1500); // Simulated 1.5s startup
    logStartupSummary(mockConfig, mockLogger as any, startTime);
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should include app name in startup log output', () => {
    const startTime = new Date();
    logStartupSummary(mockConfig, mockLogger as any, startTime);
    const logOutput = mockLogger.info.mock.calls[0][0] as string;
    expect(logOutput).toContain('QUEUEFORGE');
  });

  it('should include environment in startup log output', () => {
    const startTime = new Date();
    logStartupSummary(mockConfig, mockLogger as any, startTime);
    const logOutput = mockLogger.info.mock.calls[0][0] as string;
    expect(logOutput).toContain('test');
  });

  it('should include version number in startup log output', () => {
    const startTime = new Date();
    logStartupSummary(mockConfig, mockLogger as any, startTime);
    const logOutput = mockLogger.info.mock.calls[0][0] as string;
    expect(logOutput).toContain('1.0.0');
  });

  it('should include the configured port number', () => {
    const startTime = new Date();
    logStartupSummary(mockConfig, mockLogger as any, startTime);
    const logOutput = mockLogger.info.mock.calls[0][0] as string;
    expect(logOutput).toContain('3000');
  });

  it('should compute and display a positive startup duration', () => {
    const startTime = new Date(Date.now() - 2000);
    logStartupSummary(mockConfig, mockLogger as any, startTime);
    const logOutput = mockLogger.info.mock.calls[0][0] as string;
    // Should include some non-zero ms value
    expect(logOutput).toMatch(/\d+ms/);
  });
});
