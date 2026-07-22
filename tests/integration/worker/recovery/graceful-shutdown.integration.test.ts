import { GracefulShutdownHandler } from '../../../../src/worker/recovery/graceful-shutdown';

jest.mock('../../../../src/infrastructure/redis/client', () => ({
  disconnectRedis: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../../src/infrastructure/database/client', () => ({
  disconnectDatabase: jest.fn().mockResolvedValue(undefined),
}));

describe('Graceful Shutdown Integration Tests', () => {
  let handler: GracefulShutdownHandler;
  let worker: any;
  let config: any;
  let logger: any;

  beforeEach(() => {
    worker = {
      stop: jest.fn().mockResolvedValue(undefined),
      getStats: jest.fn().mockResolvedValue({ processed: 5, failed: 0, uptime: 10 }),
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

  it('should run shutdown procedures cleanly', async () => {
    await expect(handler.shutdown()).resolves.not.toThrow();
  });
});
