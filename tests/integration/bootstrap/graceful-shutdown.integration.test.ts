/**
 * Graceful Shutdown Integration Test
 * Tests the full shutdown sequence against a mocked running container.
 */
import { gracefulShutdown } from '../../../src/bootstrap/shutdown';

const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
  throw new Error(`process.exit(${code})`);
});

describe('Graceful Shutdown Integration Tests', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const buildContainer = (shutdownResult: 'resolve' | 'reject' = 'resolve') => ({
    shutdown: shutdownResult === 'resolve'
      ? jest.fn().mockResolvedValue(undefined)
      : jest.fn().mockRejectedValue(new Error('Shutdown crash')),
    getLogger: jest.fn().mockReturnValue(mockLogger),
  });

  const buildServer = (closeResult: 'success' | 'error' = 'success') => ({
    close: jest.fn().mockImplementation((cb?: (err?: Error) => void) => {
      if (cb) {
        if (closeResult === 'success') cb();
        else cb(new Error('TCP close error'));
      }
    }),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should complete full shutdown and call process.exit(0)', async () => {
    const container = buildContainer();
    const server = buildServer();
    await expect(
      gracefulShutdown(container as any, server as any, mockLogger as any, 5000)
    ).rejects.toThrow('process.exit(0)');
    expect(container.shutdown).toHaveBeenCalled();
    expect(server.close).toHaveBeenCalled();
  });

  it('should call process.exit(1) when container.shutdown throws', async () => {
    const container = buildContainer('reject');
    const server = buildServer();
    await expect(
      gracefulShutdown(container as any, server as any, mockLogger as any, 5000)
    ).rejects.toThrow('process.exit(1)');
  });

  it('should call process.exit(1) when HTTP server close fails', async () => {
    const container = buildContainer();
    const server = buildServer('error');
    await expect(
      gracefulShutdown(container as any, server as any, mockLogger as any, 5000)
    ).rejects.toThrow('process.exit(1)');
    expect(mockLogger.error).toHaveBeenCalled();
  });

  afterAll(() => {
    mockExit.mockRestore();
  });
});
