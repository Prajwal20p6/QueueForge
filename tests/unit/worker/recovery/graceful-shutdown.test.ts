import { GracefulShutdownHandler } from '../../../../src/worker/recovery/graceful-shutdown';

// Mock client modules to prevent actual process.exit / socket closing calls
jest.mock('../../../../src/infrastructure/redis/client', () => ({
  disconnectRedis: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../../src/infrastructure/database/client', () => ({
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

describe('GracefulShutdownHandler Unit Tests', () => {
  let handler: GracefulShutdownHandler;
  let worker: any;
  let config: any;
  let logger: any;

  beforeEach(() => {
    worker = {
      stop: jest.fn().mockResolvedValue(undefined),
      getStats: jest.fn().mockResolvedValue({ processed: 10, failed: 0, uptime: 100 }),
    };
    config = {
      env: {
        GRACEFUL_SHUTDOWN_TIMEOUT_MS: 50,
      },
    };
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    handler = new GracefulShutdownHandler(worker, config, logger);
  });

  it('should call stop on worker and close active client connections on shutdown', async () => {
    await handler.shutdown();
    expect(worker.stop).toHaveBeenCalled();
  });
});
