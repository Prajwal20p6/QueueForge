import { QueueConnector } from '../../../../src/worker/destinations/queue';

describe('Queue Destination Integration Tests', () => {
  let connector: QueueConnector;
  let destination: any;
  let logger: any;
  let metrics: any;
  let tracer: any;
  let queueManager: any;
  let mainQueue: any;

  beforeEach(() => {
    destination = {
      id: 'dest-1',
      endpointUrl: 'bullmq://localhost/delivery-queue',
      destinationType: 'QUEUE',
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
    mainQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };
    queueManager = {
      getMainQueue: jest.fn().mockReturnValue(mainQueue),
    };

    connector = new QueueConnector(destination, {}, logger, metrics, tracer, queueManager);
  });

  it('should format headers and enqueue payload successfully', async () => {
    const delivery: any = {
      id: 'delivery-1',
      taskResultId: 'result-1',
      destinationId: 'dest-1',
    };

    const res = await connector.execute({ body: 'payload' }, delivery);
    expect(res.success).toBe(true);
    expect(mainQueue.add).toHaveBeenCalled();
  });
});
