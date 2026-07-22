import { QueueConnector } from '../../../../src/worker/connectors/queue-connector';

describe('QueueConnector Unit Tests', () => {
  it('should publish message to target queue destination', async () => {
    const destination = {
      type: 'QUEUE',
      endpoint: 'redis://localhost:6379/queue-events',
    };

    const connector = new QueueConnector(destination);
    const result = await connector.execute({ id: 'res-200', payload: {} });

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.response.messageId).toBeDefined();
  });
});
