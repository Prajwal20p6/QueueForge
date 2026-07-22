import { DashboardController } from '../../../../src/api/controllers/dashboard.controller';

jest.mock('../../../../src/infrastructure/database/client', () => ({
  getPrismaClient: jest.fn().mockReturnValue({
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    taskResultDelivery: {
      count: jest.fn().mockResolvedValue(10),
      aggregate: jest.fn().mockResolvedValue({ _avg: { retryCount: 1.2 } }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    taskResultDeliveryAttempt: {
      aggregate: jest.fn().mockResolvedValue({ _avg: { responseTimeMs: 150 } }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  }),
}));

describe('DashboardController Unit Tests', () => {
  let controller: DashboardController;
  let repositories: any;
  let metricsRegistry: any;
  let logger: any;
  let queue: any;
  let redis: any;
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    repositories = {};
    metricsRegistry = {
      getMeter: jest.fn().mockReturnValue({
        createUpDownCounter: jest.fn().mockReturnValue({
          add: jest.fn(),
        }),
        createHistogram: jest.fn().mockReturnValue({
          record: jest.fn(),
        }),
      }),
    };
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    queue = {
      getWaitingCount: jest.fn().mockResolvedValue(1),
      getActiveCount: jest.fn().mockResolvedValue(1),
      getDelayedCount: jest.fn().mockResolvedValue(1),
      getCompletedCount: jest.fn().mockResolvedValue(10),
      getFailedCount: jest.fn().mockResolvedValue(1),
      getJobCounts: jest.fn().mockResolvedValue({ waiting: 0 }),
    };
    redis = {
      ping: jest.fn().mockResolvedValue('PONG'),
      smembers: jest.fn().mockResolvedValue(['worker-1']),
      pipeline: jest.fn().mockReturnValue({
        exists: jest.fn(),
        exec: jest.fn().mockResolvedValue([[null, 1]]),
      }),
      ttl: jest.fn().mockResolvedValue(20),
      hgetall: jest.fn().mockResolvedValue({}),
    };

    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    controller = new DashboardController(repositories, metricsRegistry, logger, queue, redis);
  });

  it('should query queueStats details successfully', async () => {
    await controller.queueStats(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  it('should query deliveryStats details successfully', async () => {
    await controller.deliveryStats(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  it('should query workerStats details successfully', async () => {
    await controller.workerStats(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  it('should query systemHealth details successfully', async () => {
    await controller.systemHealth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
});
