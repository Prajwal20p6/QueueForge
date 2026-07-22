import { WebhookConnector } from '../../../../src/worker/destinations/webhook';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WebhookConnector Unit Tests', () => {
  let connector: WebhookConnector;
  let destination: any;
  let logger: any;
  let metrics: any;
  let tracer: any;
  let signer: any;

  beforeEach(() => {
    destination = {
      id: 'dest-1',
      endpointUrl: 'http://localhost/webhook',
      destinationType: 'WEBHOOK',
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
    signer = {
      sign: jest.fn().mockReturnValue('mock-signature'),
    };

    connector = new WebhookConnector(destination, {}, logger, metrics, tracer, signer);
  });

  it('should validate endpointUrl successfully', async () => {
    await expect(connector.validate()).resolves.not.toThrow();

    const invalid = new WebhookConnector(
      { ...destination, endpointUrl: 'invalid-url' },
      {},
      logger,
      metrics,
      tracer,
      signer
    );
    await expect(invalid.validate()).rejects.toThrow();
  });

  it('should deliver webhook POST payload successfully', async () => {
    mockedAxios.post.mockResolvedValue({
      status: 200,
      headers: {},
      data: { success: true },
    } as any);

    const delivery: any = {
      taskResultId: 'result-1',
      destinationId: 'dest-1',
    };

    const res = await connector.execute({ test: 'payload' }, delivery);
    expect(res.success).toBe(true);
    expect(res.statusCode).toBe(200);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost/webhook',
      { test: 'payload' },
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Signature': 'mock-signature',
        }),
      })
    );
  });
});
