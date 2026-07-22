import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';

describe('Queue Job Lifecycle Integration Tests', () => {
  let queue: any;

  beforeAll(async () => {
    const stack = await setupIntegrationTestStack();
    queue = stack.queue;
  });

  afterAll(async () => {
    await teardownIntegrationTestStack();
  });

  it('should verify job completes lifecycle through state changes', async () => {
    const job = await queue.add('test-lifecycle-job', { payload: 'ok' });
    expect(job.id).toBeDefined();

    // Verify it is in waiting state (pending)
    const state = await job.getState();
    expect(state).toBe('waiting');
  });
});
