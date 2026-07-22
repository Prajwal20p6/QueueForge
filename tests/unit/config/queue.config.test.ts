import { loadQueueConfig } from '../../../src/config/queue.config';

describe('Config: queue.config.ts', () => {
  it('should successfully build QueueConfig', () => {
    process.env.QUEUE_CONCURRENCY = '5';
    const config = loadQueueConfig();
    expect(config.mainQueueName).toBe('delivery-queue');
    expect(config.concurrency).toBe(5);
  });
});
