import { DatabaseConnector } from '../../../../src/worker/connectors/database-connector';

describe('DatabaseConnector Unit Tests', () => {
  it('should execute database record insertion successfully', async () => {
    const destination = {
      type: 'DATABASE',
      endpoint: 'postgresql://user:pass@localhost:5432/mydb',
    };

    const connector = new DatabaseConnector(destination);
    const result = await connector.execute({ id: 'res-100', payload: {} });

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.response.insertedId).toBeDefined();
  });
});
