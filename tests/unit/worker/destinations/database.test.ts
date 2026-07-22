import { DatabaseConnector } from '../../../../src/worker/destinations/database';

describe('DatabaseConnector Unit Tests', () => {
  let connector: DatabaseConnector;
  let destination: any;
  let logger: any;
  let metrics: any;
  let tracer: any;
  let prisma: any;

  beforeEach(() => {
    destination = {
      id: 'dest-1',
      endpointUrl: 'public.delivery_payloads',
      destinationType: 'DATABASE',
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
          setAttribute: jest.fn(),
          end: jest.fn(),
        }),
      }),
      getTraceId: jest.fn().mockReturnValue('trace-123'),
    };
    prisma = {
      $transaction: jest.fn().mockImplementation((cb) => cb(prisma)),
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
    };

    connector = new DatabaseConnector(destination, {}, logger, metrics, tracer, prisma);
  });

  it('should validate database destinations path', async () => {
    await expect(connector.validate()).resolves.not.toThrow();

    const invalid = new DatabaseConnector(
      { ...destination, endpointUrl: '' },
      {},
      logger,
      metrics,
      tracer,
      prisma
    );
    await expect(invalid.validate()).rejects.toThrow();
  });

  it('should run insert transaction raw query successfully', async () => {
    const delivery: any = {
      id: 'delivery-1',
      taskResultId: 'result-1',
      status: 'PROCESSING',
    };

    const res = await connector.execute({ val: 123 }, delivery);
    expect(res.success).toBe(true);
    expect(prisma.$executeRawUnsafe).toHaveBeenCalled();
  });
});
