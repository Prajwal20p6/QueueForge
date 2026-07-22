import { AuditEvents, AuditEventDescriptions } from '../../../../src/observability/audit/audit-events';

describe('AuditEvents Unit Tests', () => {
  it('should verify event constants properties match expectations', () => {
    expect(AuditEvents.ENTITY_CREATED).toBe('ENTITY_CREATED');
    expect(AuditEvents.AUTH_SUCCESS).toBe('AUTH_SUCCESS');
    expect(AuditEvents.WORKER_CRASHED).toBe('WORKER_CRASHED');
  });

  it('should verify descriptions registry mapping holds explanation templates', () => {
    expect(AuditEventDescriptions[AuditEvents.ENTITY_CREATED]).toContain('created');
    expect(AuditEventDescriptions[AuditEvents.RATE_LIMIT_VIOLATED]).toContain('limit');
  });
});
