import { runInspector } from '../../../scripts/queue-inspect';

jest.mock('bullmq', () => {
  return {
    Queue: jest.fn().mockImplementation(() => ({
      getJobCounts: jest.fn().mockResolvedValue({ waiting: 0, active: 0, delayed: 0, failed: 0, completed: 0 }),
      getJobs: jest.fn().mockResolvedValue([]),
      getJob: jest.fn().mockResolvedValue(null),
      drain: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
  }));
});

describe('queue-inspect CLI Tool unit tests', () => {
  let originalArgv: string[];

  beforeAll(() => {
    originalArgv = process.argv;
  });

  afterAll(() => {
    process.argv = originalArgv;
  });

  it('should run helper usage command', async () => {
    process.argv = ['node', 'scripts/queue-inspect.ts', 'help'];
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runInspector();

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute queue stats inspections command', async () => {
    process.argv = ['node', 'scripts/queue-inspect.ts', 'queue', 'queueforge-test'];
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runInspector();

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
