import { DependencyChecker } from '../../../../src/daemon/health/dependency-checker';

describe('DependencyChecker Unit Tests', () => {
  let checker: DependencyChecker;
  let prisma: any;
  let redis: any;
  let queue: any;
  let logger: any;
  let metrics: any;

  beforeEach(() => {
    prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    };
    redis = {
      ping: jest.fn().mockResolvedValue('PONG'),
    };
    queue = {
      getJobCounts: jest.fn().mockResolvedValue({ waiting: 0 }),
    };
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    metrics = {
      getMeter: jest.fn().mockReturnValue({
        createUpDownCounter: jest.fn().mockReturnValue({
          add: jest.fn(),
        }),
        createHistogram: jest.fn().mockReturnValue({
          record: jest.fn(),
        }),
      }),
    };

    checker = new DependencyChecker(prisma, redis, queue, logger, metrics);
  });

  it('should return HEALTHY when all systems ping successfully', async () => {
    const res = await checker.checkAll();
    expect(res.overall).toBe('HEALTHY');
    expect(res.database).toBe('HEALTHY');
    expect(res.redis).toBe('HEALTHY');
    expect(res.queue).toBe('HEALTHY');
  });

  it('should return UNHEALTHY overall if any critical connection fails', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection timeout'));
    const res = await checker.checkAll();
    expect(res.overall).toBe('UNHEALTHY');
    expect(res.database).toBe('UNHEALTHY');
  });
});
