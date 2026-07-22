import { PrismaClient, Prisma, AuditLog } from '@prisma/client';
import { Logger } from 'winston';
import { BaseRepository, AuditContext } from './base-repository';
import { ValidationError } from '../../shared/errors/validation-error';
import { NotFoundError } from '../../shared/errors/not-found-error';

export interface AuditLogEvent {
  eventType: string;
  entityType: string;
  entityId: string;
  userId?: string;
  action: string;
  changes: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * AuditLogRepository implements an immutable append-only query layer for auditing operations,
 * throwing errors on attempts to alter records, and providing data retention cleanup.
 */
export class AuditLogRepository extends BaseRepository<AuditLog, Prisma.AuditLogCreateInput, Prisma.AuditLogUpdateInput> {
  constructor(prisma: PrismaClient, logger: Logger) {
    super(prisma, logger, 'auditLog');
  }

  // --- Enforce Immutability by Blocking Writes & Modifying Methods ---

  public async update(
    _id?: string,
    _data?: Prisma.AuditLogUpdateInput,
    _txOrContext?: Prisma.TransactionClient | AuditContext,
    _context?: AuditContext
  ): Promise<AuditLog> {
    throw new ValidationError('Audit logs are immutable and cannot be updated');
  }

  public async delete(
    _id?: string,
    _txOrContext?: Prisma.TransactionClient | AuditContext,
    _context?: AuditContext
  ): Promise<AuditLog> {
    throw new ValidationError('Audit logs are immutable and cannot be deleted');
  }

  public async updateMany(_where: any, _data: Prisma.AuditLogUpdateInput): Promise<number> {
    throw new ValidationError('Audit logs are immutable and cannot be updated');
  }

  public async deleteMany(_where: any): Promise<number> {
    throw new ValidationError('Audit logs are immutable and cannot be deleted');
  }

  // --- Implement BaseRepository Abstract Methods ---

  public async getAll(): Promise<AuditLog[]> {
    return this.findMany();
  }

  public async getById(id: string): Promise<AuditLog | null> {
    const record = await this.findUnique({ id });
    if (!record) {
      throw new NotFoundError(`AuditLog not found with id: ${id}`);
    }
    return record;
  }

  public async create(
    data: Prisma.AuditLogCreateInput,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<AuditLog> {
    const { tx } = this.parseTxAndContext(txOrContext, context);
    return this.executeQuery(async () => {
      const client = tx ? (tx as any).auditLog : this.modelDelegate;
      return await client.create({ data });
    });
  }

  // --- Specific Repository Methods ---

  public async createAuditLog(
    eventType: string,
    entityType: string,
    entityId: string,
    actorId: string,
    action: string,
    changes: any
  ): Promise<AuditLog> {
    return this.executeQuery(async () => {
      return await this.modelDelegate.create({
        data: {
          eventType,
          entityType,
          entityId,
          actorId,
          action,
          changes: changes || {},
        },
      });
    });
  }

  /**
   * Logs a new audit log event in the append-only ledger.
   */
  public async log(event: AuditLogEvent): Promise<AuditLog> {
    return this.create({
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      actorId: event.userId || null,
      action: event.action,
      changes: event.changes || {},
      ipAddress: event.ipAddress || null,
      userAgent: event.userAgent || null,
    });
  }

  /**
   * Queries logs by eventType, entityId, or createdAt date ranges.
   */
  public async queryLogs(
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
    return this.findMany(where, pagination);
  }

  /**
   * Purges old audit log entries older than specified retention period (days).
   */
  public async purgeOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - days * 86400000);
    this.logger.info(`[AuditLogRepository] Purging audit logs created before ${cutoffDate.toISOString()}`);
    return this.executeQuery(async () => {
      const res = await this.modelDelegate.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });
      return res.count;
    });
  }
}
