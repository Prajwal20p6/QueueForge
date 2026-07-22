import { QueueReconstructor } from '../../../../src/daemon/recovery/queue-reconstruction';

describe('QueueReconstructor Unit Tests', () => {
  let reconstructor: QueueReconstructor;
  let repository: any;
  let queue: any;
  let logger: any;
  let metrics: any;

  beforeEach(() => {
    repository = {
      findMany: jest.fn().mockImplementation((filter) => {
        if (filter.status === 'PENDING') {
          return Promise.resolve({ data: [{ id: 'del-1', taskResultId: 'res-1', destinationId: 'dest-1', retryCount: 0 }] });
        }
        return Promise.resolve({ data: [] });
      }),
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

    reconstructor = new QueueReconstructor(repository, queue, logger, metrics);
  });

  it('should reconstruct active pending queues on startup', async () => {
    const res = await reconstructor.reconstruct();
    expect(res.main).toBe(1);
    expect(res.delayed).toBe(0);
    expect(queue.add).toHaveBeenCalled();
  });
});
