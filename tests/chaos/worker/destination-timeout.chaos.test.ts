import { WebhookConnector } from '../../../src/worker/destinations/webhook';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Destination Timeout Chaos Tests', () => {
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
      sign: jest.fn().mockReturnValue('signature'),
    };

    connector = new WebhookConnector(destination, {}, logger, metrics, tracer, signer);
  });

  it('should abort and throw connection timeout when destination is extremely slow', async () => {
    // Simulate resolution to avoid unhandled promise rejection when withTimeout rejects early
    mockedAxios.post.mockResolvedValue({ status: 200, data: {} } as any);

    const delivery: any = {
      taskResultId: 'result-1',
      destinationId: 'dest-1',
    };

    // Override the timeout in connector execution to trigger fast timeout in test
    jest.spyOn(connector as any, 'withTimeout').mockRejectedValue(new Error('Webhook HTTP POST timed out after 30000ms'));

    const res = await connector.execute({ val: 'slow' }, delivery);
    expect(res.success).toBe(false);
    expect(res.message!.toLowerCase()).toContain('time');
  });
});
