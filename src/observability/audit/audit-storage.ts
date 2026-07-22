import { AuditEvent } from './audit-event';

export interface AuditQueryFilters {
  entityId?: string;
  entityType?: string;
  eventType?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
}

/**
 * Interface defining append-only audit trail storage capabilities.
 */
export interface AuditStorage {
  store(event: AuditEvent): Promise<void>;
  query(filters: AuditQueryFilters): Promise<AuditEvent[]>;
  cleanup(olderThanDays: number): Promise<number>;
}

/**
 * PostgreSQL / In-Memory Audit Storage implementation.
 */
export class DatabaseAuditStorage implements AuditStorage {
  private readonly events: AuditEvent[] = [];

  constructor(private readonly prismaClient?: any) {}

  public async store(event: AuditEvent): Promise<void> {
    this.events.push(event);
    if (this.prismaClient?.auditLog?.create) {
      try {
        await this.prismaClient.auditLog.create({
          data: {
            id: event.id,
            timestamp: event.timestamp,
            eventType: event.eventType,
            entityType: event.entityType,
            entityId: event.entityId,
            action: event.action,
            userId: event.userId,
            apiKeyId: event.apiKeyId,
            changes: event.changes ? JSON.stringify(event.changes) : null,
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            success: event.success,
            error: event.error,
          },
        });
      } catch {
        // ignore
      }
    }
  }

  public async query(filters: AuditQueryFilters): Promise<AuditEvent[]> {
    return this.events.filter(e => {
      if (filters.entityId && e.entityId !== filters.entityId) return false;
      if (filters.entityType && e.entityType !== filters.entityType) return false;
      if (filters.eventType && e.eventType !== filters.eventType) return false;
      if (filters.userId && e.userId !== filters.userId) return false;
      if (filters.startDate && new Date(e.timestamp) < filters.startDate) return false;
      if (filters.endDate && new Date(e.timestamp) > filters.endDate) return false;
      if (filters.success !== undefined && e.success !== filters.success) return false;
      return true;
    });
  }

  public async cleanup(olderThanDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 86400000);
    const initialCount = this.events.length;
    let idx = this.events.length;

    while (idx--) {
      if (new Date(this.events[idx].timestamp) < cutoff) {
        this.events.splice(idx, 1);
      }
    }

    return initialCount - this.events.length;
  }
}
