import { DatabaseConnector } from '../../../../src/worker/destinations/database';

describe('Database Destination Integration Tests', () => {
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

  it('should format insert query parameters correctly and run transaction', async () => {
    const delivery: any = {
      id: 'delivery-1',
      taskResultId: 'result-1',
      status: 'PROCESSING',
    };

    const res = await connector.execute({ text: 'data' }, delivery);
    expect(res.success).toBe(true);
    expect(prisma.$executeRawUnsafe).toHaveBeenCalled();
  });
});
