import { runDeliveryInspector } from '../../../scripts/delivery-inspect';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    taskResultDelivery: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
    aiTaskResult: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

describe('delivery-inspect CLI Tool unit tests', () => {
  let originalArgv: string[];

  beforeAll(() => {
    originalArgv = process.argv;
  });

  afterAll(() => {
    process.argv = originalArgv;
  });

  it('should run helper usage command', async () => {
    process.argv = ['node', 'scripts/delivery-inspect.ts', 'help'];
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runDeliveryInspector();

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute dlq inspections command', async () => {
    process.argv = ['node', 'scripts/delivery-inspect.ts', 'dlq'];
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runDeliveryInspector();

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
