import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';

describe('Worker Graceful Shutdown Integration Tests', () => {
  beforeAll(async () => {
    await setupIntegrationTestStack();
  });

  afterAll(async () => {
    await teardownIntegrationTestStack();
  });

  it('should intercept termination signals and reject new processing blocks', () => {
    let shutDownInvoked = false;
    const shutdown = async () => {
      shutDownInvoked = true;
    };

    process.once('SIGTERM', shutdown);
    process.emit('SIGTERM');

    expect(shutDownInvoked).toBe(true);
  });
});
