import { gracefulShutdown } from '../../../src/bootstrap/shutdown';

// Mock process.exit to prevent actual termination during tests
const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
  throw new Error(`process.exit(${code})`);
});

describe('GracefulShutdown Unit Tests', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const mockContainer = {
    shutdown: jest.fn().mockResolvedValue(undefined),
    getLogger: jest.fn().mockReturnValue(mockLogger),
  };

  const mockServer = {
    close: jest.fn().mockImplementation((cb?: (err?: Error) => void) => {
      if (cb) cb(); // call with no error = success
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should call server.close and container.shutdown then exit(0)', async () => {
    await expect(
      gracefulShutdown(mockContainer as any, mockServer as any, mockLogger as any, 5000)
    ).rejects.toThrow('process.exit(0)');

    expect(mockServer.close).toHaveBeenCalled();
    expect(mockContainer.shutdown).toHaveBeenCalled();
  });

  it('should call process.exit(1) when server close fails', async () => {
    const failServer = {
      close: jest.fn().mockImplementation((cb?: (err?: Error) => void) => {
        if (cb) cb(new Error('Socket hang'));
      }),
    };

    await expect(
      gracefulShutdown(mockContainer as any, failServer as any, mockLogger as any, 5000)
    ).rejects.toThrow('process.exit(1)');
    expect(mockLogger.error).toHaveBeenCalled();
  });

  afterAll(() => {
    mockExit.mockRestore();
  });
});
