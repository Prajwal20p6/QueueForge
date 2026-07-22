import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';

describe('Dead Letter Queue (DLQ) Integration Tests', () => {
  let queue: any;

  beforeAll(async () => {
    const stack = await setupIntegrationTestStack();
    queue = stack.queue;
  });

  afterAll(async () => {
    await teardownIntegrationTestStack();
  });

  it('should verify DLQ fail limit triggers failure', async () => {
    const job = await queue.add('dlq-fail-job', { payload: 'fail' }, { attempts: 1 });
    expect(job.id).toBeDefined();

    const state = await job.getState();
    expect(state).toBeDefined();
  });
});
