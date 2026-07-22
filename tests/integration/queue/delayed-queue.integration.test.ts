import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';

describe('Delayed Queue Integration Tests', () => {
  let queue: any;

  beforeAll(async () => {
    const stack = await setupIntegrationTestStack();
    queue = stack.queue;
  });

  afterAll(async () => {
    await teardownIntegrationTestStack();
  });

  it('should schedule job with a delay and check state is delayed', async () => {
    const job = await queue.add('delayed-job', { payload: 'delayed-ok' }, { delay: 5000 });
    expect(job.id).toBeDefined();

    const state = await job.getState();
    expect(state).toBe('delayed');
  });
});
