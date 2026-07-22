import { PrismaClient, Prisma, TaskResultDelivery, DeliveryStatus } from '@prisma/client';
import { Logger } from 'winston';
import { BaseRepository, AuditContext } from './base-repository';
import { NotFoundError } from '../../shared/errors/not-found-error';
import { ValidationError } from '../../shared/errors/validation-error';

export interface TimelineEvent {
  id: string;
  type: string; // 'CREATION' | 'ATTEMPT' | 'STATUS_CHANGE'
  timestamp: Date;
  details: any;
}

export interface StatsFilters {
  startDate?: Date;
  endDate?: Date;
  destinationId?: string;
}

export interface DeliveryStats {
  total: number;
  successRate: number;
  avgLatencyMs: number;
  failureRate: number;
  byStatus: Record<string, number>;
}

/**
 * DeliveryRepository manages delivery workflow processing states, scheduling retries,
 * timeline construction, and statistical summaries.
 */
export class DeliveryRepository extends BaseRepository<TaskResultDelivery, Prisma.TaskResultDeliveryUncheckedCreateInput, Prisma.TaskResultDeliveryUpdateInput> {
  constructor(prisma: PrismaClient, logger: Logger) {
    super(prisma, logger, 'taskResultDelivery');
  }

  // --- Implement BaseRepository Abstract Methods ---

  public async getAll(): Promise<TaskResultDelivery[]> {
    return this.findMany();
  }

  public async getById(id: string): Promise<TaskResultDelivery | null> {
    const record = await this.findFirst({ id }, { include: { attempts: true } });
    if (!record) {
      throw new NotFoundError(`TaskResultDelivery not found with id: ${id}`);
    }
    return record;
  }

  public async create(
    data: Prisma.TaskResultDeliveryUncheckedCreateInput,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<TaskResultDelivery> {
    const { tx, auditCtx } = this.parseTxAndContext(txOrContext, context);
    return this.executeQuery(async () => {
      const client = tx || this.prisma;
      const created = await client.taskResultDelivery.create({ data: data as any });
      await this.logAudit(tx, 'DELIVERY_CREATED', created.id, 'CREATE', data, auditCtx);
      return created;
    });
  }

  public async update(
    id: string,
    data: Prisma.TaskResultDeliveryUpdateInput,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<TaskResultDelivery> {
    const { tx, auditCtx } = this.parseTxAndContext(txOrContext, context);
    return this.executeQuery(async () => {
      const client = tx || this.prisma;
      const updated = await client.taskResultDelivery.update({
        where: { id },
        data,
      });
      await this.logAudit(tx, 'DELIVERY_UPDATED', id, 'UPDATE', data, auditCtx);
      return updated;
    });
  }

  public async delete(
    id: string,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<TaskResultDelivery> {
    const { tx, auditCtx } = this.parseTxAndContext(txOrContext, context);
    return this.executeQuery(async () => {
      const client = tx || this.prisma;
      const deleted = await client.taskResultDelivery.delete({
        where: { id },
      });
      await this.logAudit(tx, 'DELIVERY_DELETED', id, 'DELETE', null, auditCtx);
      return deleted;
    });
  }

  // --- Specific Repository Methods ---

  public async createDelivery(
    data: Prisma.TaskResultDeliveryUncheckedCreateInput,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<TaskResultDelivery> {
    return this.create(data, txOrContext, context);
  }

  public async recordAttempt(
    deliveryId: string,
    data: { responseStatus?: number | null; responseTimeMs?: number | null; errorMessage?: string | null }
  ): Promise<void> {
    await this.executeQuery(async () => {
      const delivery = await this.prisma.taskResultDelivery.findFirstOrThrow({
        where: { id: deliveryId },
      });
      const nextAttemptNumber = delivery.retryCount + 1;

      // Validate HTTP status range [100, 599] if provided
      if (data.responseStatus !== undefined && data.responseStatus !== null) {
        if (data.responseStatus < 100 || data.responseStatus > 599) {
          throw new ValidationError('Invalid HTTP response status range');
        }
      }

      await this.prisma.taskResultDeliveryAttempt.create({
        data: {
          deliveryId,
          attemptNumber: nextAttemptNumber,
          responseStatus: data.responseStatus ?? null,
          responseTimeMs: data.responseTimeMs ?? 0,
          errorMessage: data.errorMessage ?? undefined,
        },
      });

      await this.prisma.taskResultDelivery.update({
        where: { id: deliveryId },
        data: {
          retryCount: nextAttemptNumber,
        },
      });
    });
  }

  /**
   * Finds deliveries by status.
   */
  public async findByStatus(status: DeliveryStatus): Promise<TaskResultDelivery[]> {
    return this.findMany({ status }, { include: { attempts: true } });
  }

  /**
   * Finds deliveries associated with status and destination.
   */
  public async findByStatusAndDestination(status: DeliveryStatus, destinationId: string): Promise<TaskResultDelivery[]> {
    return this.findMany({ status, destinationId }, { include: { attempts: true } });
  }

  /**
   * Queries retries scheduled to be run at or before current time.
   */
  public async findScheduledRetries(tx?: Prisma.TransactionClient): Promise<TaskResultDelivery[]> {
    const client = tx || this.prisma;
    return this.executeQuery(async () => {
      return await client.taskResultDelivery.findMany({
        where: {
          status: DeliveryStatus.SCHEDULED_RETRY,
          nextRetryAt: {
            lte: new Date(),
          },
        },
        include: {
          attempts: {
            orderBy: { attemptNumber: 'desc' },
          },
        },
      });
    });
  }

  /**
   * Queries deliveries permanently failed and deposited in the Dead Letter Queue.
   */
  public async findInDLQ(): Promise<TaskResultDelivery[]> {
    return this.findMany({ status: DeliveryStatus.FAILED_DLQ }, { include: { attempts: true } });
  }

  /**
   * Queries deliveries associated with an AI task result ID.
   */
  public async findByResultId(resultId: string): Promise<TaskResultDelivery[]> {
    return this.findMany({ taskResultId: resultId }, { include: { attempts: true } });
  }

  /**
   * Queries deliveries associated with a destination endpoint ID.
   */
  public async findByDestinationId(destinationId: string): Promise<TaskResultDelivery[]> {
    return this.findMany({ destinationId }, { include: { attempts: true } });
  }

  /**
   * Updates delivery status atomically.
   */
  public async updateStatus(
    id: string,
    newStatus: DeliveryStatus,
    tx?: Prisma.TransactionClient
  ): Promise<TaskResultDelivery> {
    const client = tx || this.prisma;
    return this.executeQuery(async () => {
      return await client.taskResultDelivery.update({
        where: { id },
        data: { status: newStatus },
      });
    });
  }

  public async findDeliveryById(id: string, tx?: Prisma.TransactionClient): Promise<TaskResultDelivery | null> {
    return this.findFirst({ id }, { include: { attempts: true } }, tx);
  }

  public async findDeliveriesByResultId(resultId: string, tx?: Prisma.TransactionClient): Promise<TaskResultDelivery[]> {
    return this.findMany({ taskResultId: resultId }, { include: { attempts: true } }, tx);
  }

  public async updateDeliveryStatus(
    id: string,
    status: DeliveryStatus,
    txOrContext?: Prisma.TransactionClient | any,
    context?: any
  ): Promise<TaskResultDelivery> {
    const { tx } = this.parseTxAndContext(txOrContext, context);
    return this.updateStatus(id, status, tx);
  }

  public async moveToFailed(
    id: string,
    errorMessage: string,
    txOrContext?: Prisma.TransactionClient | any,
    context?: any
  ): Promise<TaskResultDelivery> {
    const { tx } = this.parseTxAndContext(txOrContext, context);
    return this.executeQuery(async () => {
      const client = tx || this.prisma;
      return await client.taskResultDelivery.update({
        where: { id },
        data: {
          status: DeliveryStatus.FAILED_DLQ,
          lastError: errorMessage,
          errorCategory: 'FAILED',
          nextRetryAt: null,
        },
      });
    });
  }

  public async moveToDLQ(
    id: string,
    errorMessage: string,
    txOrContext?: Prisma.TransactionClient | any,
    context?: any
  ): Promise<TaskResultDelivery> {
    const { tx } = this.parseTxAndContext(txOrContext, context);
    return this.executeQuery(async () => {
      const client = tx || this.prisma;
      return await client.taskResultDelivery.update({
        where: { id },
        data: {
          status: DeliveryStatus.FAILED_DLQ,
          lastError: errorMessage,
          errorCategory: 'DLQ',
          nextRetryAt: null,
        },
      });
    });
  }

  /**
   * Schedules a retry attempt for a delivery.
   */
  public async scheduleRetry(
    id: string,
    retryAt: Date,
    txOrContext?: Prisma.TransactionClient | any,
    context?: any
  ): Promise<TaskResultDelivery> {
    const { tx } = this.parseTxAndContext(txOrContext, context);
    const client = tx || this.prisma;
    return this.executeQuery(async () => {
      return await client.taskResultDelivery.update({
        where: { id },
        data: {
          status: DeliveryStatus.SCHEDULED_RETRY,
          nextRetryAt: retryAt,
        },
      });
    });
  }

  /**
   * Generates a timeline list mapping chronological creation, changes, and attempts logs.
   */
  public async getDeliveryTimeline(resultId: string): Promise<TimelineEvent[]> {
    const deliveries = await this.findByResultId(resultId);
    const events: TimelineEvent[] = [];

    for (const del of deliveries) {
      events.push({
        id: del.id,
        type: 'CREATION',
        timestamp: del.createdAt,
        details: { status: del.status, destinationId: del.destinationId },
      });

      // Eager load attempts
      const attempts = await this.prisma.taskResultDeliveryAttempt.findMany({
        where: { deliveryId: del.id },
        orderBy: { attemptNumber: 'asc' },
      });

      attempts.forEach((att) => {
        events.push({
          id: att.id,
          type: 'ATTEMPT',
          timestamp: att.timestamp,
          details: {
            attemptNumber: att.attemptNumber,
            statusCode: att.responseStatus,
            latencyMs: att.responseTimeMs,
            errorMessage: att.errorMessage,
          },
        });
      });
    }

    return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Aggregates deliveries total counts grouped by statuses.
   */
  public async countByStatus(): Promise<Record<DeliveryStatus, number>> {
    return this.executeQuery(async () => {
      const counts = await this.prisma.taskResultDelivery.groupBy({
        by: ['status'],
        _count: {
          _all: true,
        },
      });

      const result: Record<DeliveryStatus, number> = {
        PENDING: 0,
        PROCESSING: 0,
        COMPLETED: 0,
        SCHEDULED_RETRY: 0,
        FAILED_DLQ: 0,
      };

      counts.forEach((c) => {
        result[c.status] = c._count._all;
      });

      return result;
    });
  }

  /**
   * Pulls and compiles overall delivery success, failure and latency statistics.
   */
  public async getDeliveryStats(filters?: StatsFilters): Promise<DeliveryStats> {
    const where: any = {};
    if (filters) {
      if (filters.destinationId) {
        where.destinationId = filters.destinationId;
      }
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }
    }

    return this.executeQuery(async () => {
      const records = await this.prisma.taskResultDelivery.findMany({
        where,
        include: {
          attempts: true,
        },
      });

      const total = records.length;
      const byStatus: Record<string, number> = {};
      let completedCount = 0;
      let failedCount = 0;
      let totalLatency = 0;
      let attemptsCount = 0;

      records.forEach((r) => {
        byStatus[r.status] = (byStatus[r.status] || 0) + 1;
        if (r.status === 'COMPLETED') completedCount++;
        if (r.status === 'FAILED_DLQ') failedCount++;

        r.attempts.forEach((att) => {
          totalLatency += att.responseTimeMs;
          attemptsCount++;
        });
      });

      return {
        total,
        successRate: total > 0 ? (completedCount / total) * 100 : 0,
        avgLatencyMs: attemptsCount > 0 ? totalLatency / attemptsCount : 0,
        failureRate: total > 0 ? (failedCount / total) * 100 : 0,
        byStatus,
      };
    });
  }
}
export { TaskResultDelivery as Delivery };
export { DeliveryRepository as PrismaDeliveryLogRepository };
