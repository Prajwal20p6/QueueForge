import axios from 'axios';
import { WebhookConnector } from '../../../../src/worker/connectors/webhook-connector';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WebhookConnector Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should construct HMAC signatures and execute HTTP POST request', async () => {
    mockedAxios.post.mockResolvedValue({ status: 200, data: { status: 'delivered' } } as any);

    const destination = {
      type: 'WEBHOOK',
      endpoint: 'http://localhost/post',
      secret: 'my-hmac-secret',
    };

    const connector = new WebhookConnector(destination);
    const result = await connector.execute({ id: 'res-1', payload: { data: 'test' } }, 5000);

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('should throw error if endpoint URL is missing', () => {
    expect(() => new WebhookConnector({ type: 'WEBHOOK' })).toThrow();
  });
});
