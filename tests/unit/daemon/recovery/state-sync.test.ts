import { StateSyncDaemon } from '../../../../src/daemon/recovery/state-sync';

describe('StateSyncDaemon Unit Tests', () => {
  let daemon: StateSyncDaemon;
  let repository: any;
  let queue: any;
  let redis: any;
  let logger: any;
  let metrics: any;

  beforeEach(() => {
    repository = {
      findMany: jest.fn().mockResolvedValue({
        data: [{ id: 'delivery-1', taskResultId: 'result-1', destinationId: 'dest-1', retryCount: 0 }],
      }),
      findOne: jest.fn().mockResolvedValue(null),
    };
    queue = {
      getJobs: jest.fn().mockResolvedValue([]),
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };
    redis = {};
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

    daemon = new StateSyncDaemon(repository, queue, redis, logger, metrics);
  });

  it('should identify missing queue jobs and re-enqueue them', async () => {
    const res = await daemon.sync();
    expect(res.synced).toBe(1);
    expect(queue.add).toHaveBeenCalledWith(
      'result-1:dest-1',
      expect.any(Object),
      expect.any(Object)
    );
  });
});
