import { AuditLog } from '@prisma/client';
import { BaseRepository } from '../../infrastructure/repositories/base.repository';
import { AuditEvent } from '../types';

/**
 * Repository adapter wrapping AuditLog database mutations and queries.
 */
export class AuditRepository {
  private readonly repository: BaseRepository<AuditLog>;

  constructor(repository: BaseRepository<AuditLog>) {
    this.repository = repository;
  }

  /**
   * Appends a new immutable AuditLog entry.
   */
  public async log(event: AuditEvent): Promise<void> {
    await this.repository.create({
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      actorId: event.actorId || null,
      action: event.action,
      changes: event.changes || {},
      createdAt: event.timestamp || new Date(),
    } as any);
  }

  /**
   * Queries logs filtering by events, entity IDs, or date ranges.
   */
  public async getLogs(
    filters?: { eventType?: string; entityId?: string; dateRange?: { from: Date; to: Date } },
    pagination?: { page?: number; limit?: number }
  ): Promise<{ data: AuditLog[]; total: number }> {
    const where: any = {};
    if (filters?.eventType) {
      where.eventType = filters.eventType;
    }
    if (filters?.entityId) {
      where.entityId = filters.entityId;
    }
    if (filters?.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.from,
        lte: filters.dateRange.to,
      };
    }

    const res = await this.repository.findMany(where, pagination);
    return {
      data: res.data,
      total: res.total,
    };
  }

  /**
   * Computes aggregated count statistics of logs.
   */
  public async getStats(): Promise<{
    total: number;
    byEventType: Record<string, number>;
    dateRange: { oldest: Date; newest: Date };
  }> {
    if (typeof (this.repository as any).getAuditStats === 'function') {
      const stats = await (this.repository as any).getAuditStats();
      return {
        total: stats.total,
        byEventType: stats.byEventType,
        dateRange: stats.dateRange,
      };
    }

    // Fallback manual stats builder
    const res = await this.repository.findMany({}, { limit: 1000 });
    const records = res.data;
    const total = records.length;
    if (total === 0) {
      const epoch = new Date(0);
      return {
        total: 0,
        byEventType: {},
        dateRange: { oldest: epoch, newest: epoch },
      };
    }

    const byEventType: Record<string, number> = {};
    for (const r of records) {
      byEventType[r.eventType] = (byEventType[r.eventType] || 0) + 1;
    }

    return {
      total,
      byEventType,
      dateRange: {
        oldest: records[0].createdAt || new Date(),
        newest: records[total - 1].createdAt || new Date(),
      },
    };
  }
}
export { AuditLog };
