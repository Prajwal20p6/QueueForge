import { GracefulShutdown } from '../../../../src/bootstrap/server/graceful-shutdown';

describe('GracefulShutdown Unit Tests', () => {
  it('should execute teardown steps sequentially without throwing errors', async () => {
    const mockServer = { close: jest.fn((cb: any) => cb()) };
    const mockWorker = { stop: jest.fn().mockResolvedValue(undefined) };
    const mockDaemons = { stop: jest.fn().mockResolvedValue(undefined) };

    const shutdown = new GracefulShutdown(mockServer, mockWorker, mockDaemons);

    await expect(shutdown.shutdown()).resolves.not.toThrow();
    expect(mockServer.close).toHaveBeenCalled();
    expect(mockWorker.stop).toHaveBeenCalled();
    expect(mockDaemons.stop).toHaveBeenCalled();
  });
});
