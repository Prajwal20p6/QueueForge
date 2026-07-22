import { StaleJobDetector } from '../../../src/worker/recovery/stale-job-detector';
import { DeliveryStatus } from '@prisma/client';

describe('Worker Crash Chaos Tests', () => {
  let detector: StaleJobDetector;
  let redis: any;
  let repository: any;
  let queue: any;
  let logger: any;
  let metrics: any;

  beforeEach(() => {
    redis = {};
    repository = {
      findMany: jest.fn().mockResolvedValue({
        data: [{ id: 'delivery-1', taskResultId: 'result-1', destinationId: 'dest-1', retryCount: 0 }],
      }),
      findById: jest.fn().mockResolvedValue({
        id: 'delivery-1',
        taskResultId: 'result-1',
        destinationId: 'dest-1',
        retryCount: 0,
      }),
      updateDeliveryStatus: jest.fn(),
    };
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

    detector = new StaleJobDetector(redis, repository, queue, logger, metrics);
  });

  it('should detect stale processing job on crash and re-enqueue it successfully', async () => {
    const res = await detector.detectStale();
    expect(res).toBe(1);
    expect(queue.add).toHaveBeenCalled();
    expect(repository.updateDeliveryStatus).toHaveBeenCalledWith(
      'delivery-1',
      DeliveryStatus.PENDING,
      undefined,
      expect.any(Object)
    );
  });
});
