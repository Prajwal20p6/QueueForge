import { QueueConnector } from '../../../src/worker/destinations/queue';

describe('Connection Failure Chaos Tests', () => {
  let connector: QueueConnector;
  let destination: any;
  let logger: any;
  let metrics: any;
  let tracer: any;
  let queueManager: any;

  beforeEach(() => {
    destination = {
      id: 'dest-1',
      endpointUrl: 'bullmq://localhost/connection_failed', // Magic keyword for mock transient connection failure
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
    queueManager = {};

    connector = new QueueConnector(destination, {}, logger, metrics, tracer, queueManager);
  });

  it('should capture socket connection failures and flag them as transient', async () => {
    const delivery: any = {
      id: 'delivery-1',
      taskResultId: 'result-1',
      destinationId: 'dest-1',
    };

    const res = await connector.execute({ val: 'data' }, delivery);
    expect(res.success).toBe(false);
    expect(res.metadata?.isPermanent).toBe(false);
  });
});
