import { AuditConnector } from '../../../../src/worker/connectors/audit-connector';

describe('AuditConnector Unit Tests', () => {
  it('should log immutable audit trail entry and always succeed', async () => {
    const destination = {
      type: 'AUDIT',
    };

    const connector = new AuditConnector(destination);
    const result = await connector.execute({ id: 'res-300' });

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.response.auditLogId).toBeDefined();
  });
});
