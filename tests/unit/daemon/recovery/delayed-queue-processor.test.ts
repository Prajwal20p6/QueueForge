import { DelayedQueueProcessor } from '../../../../src/daemon/recovery/delayed-queue-processor';
import { DeliveryStatus } from '@prisma/client';

describe('DelayedQueueProcessor Unit Tests', () => {
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
    repository = {
      findMany: jest.fn().mockResolvedValue({
        data: [{ id: 'delivery-1', taskResultId: 'result-1', destinationId: 'dest-1', retryCount: 1 }],
      }),
      updateDeliveryStatus: jest.fn(),
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

    processor = new DelayedQueueProcessor(queue, repository, logger, metrics, tracer);
  });

  it('should process overdue retries and schedule in BullMQ', async () => {
    const count = await processor.processScheduledRetries();
    expect(count).toBe(1);
    expect(repository.findMany).toHaveBeenCalled();
    expect(repository.updateDeliveryStatus).toHaveBeenCalledWith(
      'delivery-1',
      DeliveryStatus.PENDING,
      undefined,
      expect.any(Object)
    );
    expect(queue.add).toHaveBeenCalled();
  });
});
