import { AuditEvent, EventStats } from './audit-event';
import { AuditStorage } from './audit-storage';

/**
 * AuditReporter queries audit trail records for compliance and security auditing.
 */
export class AuditReporter {
  constructor(
    private readonly auditStorage: AuditStorage,
    _logger?: any
  ) {}

  public async getAuditTrail(entityId: string, startDate?: Date, endDate?: Date): Promise<AuditEvent[]> {
    return this.auditStorage.query({ entityId, startDate, endDate });
  }

  public async getEventStats(startDate: Date, endDate: Date): Promise<EventStats> {
    const events = await this.auditStorage.query({ startDate, endDate });

    const byEventType: Record<string, number> = {};
    const byAction: Record<string, number> = {};
    let successCount = 0;
    let failureCount = 0;

    for (const e of events) {
      byEventType[e.eventType] = (byEventType[e.eventType] || 0) + 1;
      byAction[e.action] = (byAction[e.action] || 0) + 1;
      if (e.success) successCount++;
      else failureCount++;
    }

    return {
      totalEvents: events.length,
      byEventType,
      byAction,
      successCount,
      failureCount,
    };
  }

  public async getChangeHistory(entityId: string): Promise<AuditEvent[]> {
    const events = await this.auditStorage.query({ entityId });
    return events.filter(e => e.action === 'CREATE' || e.action === 'UPDATE' || e.action === 'DELETE');
  }

  public async getUserActivity(userId: string, startDate?: Date, endDate?: Date): Promise<AuditEvent[]> {
    return this.auditStorage.query({ userId, startDate, endDate });
  }

  public async getSecurityEvents(startDate: Date, endDate: Date): Promise<AuditEvent[]> {
    const events = await this.auditStorage.query({ startDate, endDate });
    return events.filter(e => e.eventType.includes('AUTH') || e.success === false);
  }
}
