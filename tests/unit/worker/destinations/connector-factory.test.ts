import { ConnectorFactory } from '../../../../src/worker/destinations/connector-factory';

describe('ConnectorFactory Unit Tests', () => {
  let factory: ConnectorFactory;
  let config: any;
  let prisma: any;
  let queueManager: any;
  let security: any;
  let observability: any;
  let logger: any;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    config = {};
    prisma = {};
    queueManager = {};
    security = {
      signer: {},
    };
    observability = {
      logger,
      metrics: {
        getMeter: jest.fn().mockReturnValue({
          createCounter: jest.fn().mockReturnValue({
            add: jest.fn(),
          }),
        }),
      },
      tracer: {
        getTracer: jest.fn().mockReturnValue({
          startSpan: jest.fn().mockReturnValue({
            setAttribute: jest.fn(),
            end: jest.fn(),
          }),
        }),
      },
      audit: {},
    };

    factory = new ConnectorFactory(config, prisma, queueManager, security, observability);
  });

  it('should instantiate and cache Webhook connector successfully', async () => {
    const destination: any = {
      id: 'dest-1',
      endpointUrl: 'http://localhost/webhook',
      destinationType: 'WEBHOOK',
    };

    const connector = await factory.create(destination);
    expect(connector).toBeDefined();
    expect(connector.destinationType).toBe('WEBHOOK');

    // Fetch from cache
    const cached = factory.getConnector('dest-1');
    expect(cached).toBe(connector);
  });
});
