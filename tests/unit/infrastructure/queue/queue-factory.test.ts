import { QueueFactory } from '../../../../src/infrastructure/queue/queue-factory';
import { QueueClient } from '../../../../src/infrastructure/queue/queue-client';
import { QueueConfig } from '../../../../src/config/queue.config';

jest.mock('bullmq');
jest.mock('../../../../src/infrastructure/queue/queue-client');

describe('queue-factory Unit Tests', () => {
  let mockClient: jest.Mocked<QueueClient>;
  let config: QueueConfig;

  beforeEach(() => {
    mockClient = {
      createQueue: jest.fn().mockImplementation((name) => ({ name } as any)),
    } as any;
    config = {
      mainQueueName: 'main-q',
      delayedQueueName: 'delayed-q',
      dlqQueueName: 'dlq-q',
      concurrency: 5,
      defaultJobTimeout: 10000,
      staleInterval: 1000,
      lockDuration: 30000,
      lockRenewTime: 5000,
      retryBackoff: { type: 'exponential', delay: 1000 },
      maxBackoff: 5000,
      removeOnComplete: true,
      removeOnFail: false,
      defaultRepeatableKey: 'repeat',
      name: 'q',
      prefix: 'p',
      defaultJobOptions: {
        timeout: 10000,
        removeOnComplete: true,
        removeOnFail: false,
      },
      limiter: { max: 10, duration: 1000 },
      settings: {},
    };
    jest.clearAllMocks();
  });

  it('should create main, delayed, and DLQ queues with custom settings', () => {
    const main = QueueFactory.createMainQueue(mockClient, config);
    expect(main.name).toBe('main-q');
    expect(mockClient.createQueue).toHaveBeenCalledWith('main-q', expect.any(Object));

    const delayed = QueueFactory.createDelayedQueue(mockClient, config);
    expect(delayed.name).toBe('delayed-q');
    expect(mockClient.createQueue).toHaveBeenCalledWith('delayed-q', expect.any(Object));

    const dlq = QueueFactory.createDLQQueue(mockClient, config);
    expect(dlq.name).toBe('dlq-q');
    expect(mockClient.createQueue).toHaveBeenCalledWith('dlq-q', expect.any(Object));
  });
});
