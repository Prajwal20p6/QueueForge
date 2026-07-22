import { DelayedQueueProcessor } from '../../../src/daemon/recovery/delayed-queue-processor';

describe('Recovery Under Load Chaos Tests', () => {
  let processor: DelayedQueueProcessor;
  let queue: any;
  let repository: any;
  let logger: any;
  let metrics: any;
  let tracer: any;

  beforeEach(() => {
    queue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    metrics = {
      getMeter: jest.fn().mockReturnValue({
        createCounter: jest.fn().mockReturnValue({
          add: jest.fn(),
        }),
      }),
    };
    tracer = {
      getTracer: jest.fn().mockReturnValue({
        startSpan: jest.fn().mockReturnValue({
          recordException: jest.fn(),
          end: jest.fn(),
        }),
      }),
    };
  });

  it('should process a massive volume of scheduled retries without bottlenecking', async () => {
    // Generate 500 mock deliveries
    const mockDeliveries = Array.from({ length: 500 }, (_, i) => ({
      id: `delivery-${i}`,
      taskResultId: `result-${i}`,
      destinationId: `dest-${i}`,
      retryCount: 1,
    }));

    repository = {
      findMany: jest.fn().mockResolvedValue({
        data: mockDeliveries,
      }),
      updateDeliveryStatus: jest.fn().mockResolvedValue({}),
    };

    processor = new DelayedQueueProcessor(queue, repository, logger, metrics, tracer);

    const count = await processor.processScheduledRetries();
    expect(count).toBe(500);
    expect(repository.updateDeliveryStatus).toHaveBeenCalledTimes(500);
    expect(queue.add).toHaveBeenCalledTimes(500);
  });
});
