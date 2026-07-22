import { PrismaClient, Prisma, TaskResultDeliveryAttempt } from '@prisma/client';
import { Logger } from 'winston';
import { BaseRepository, AuditContext } from './base-repository';
import { NotFoundError } from '../../shared/errors/not-found-error';
import { ValidationError } from '../../shared/errors/validation-error';

export interface FailureStats {
  totalAttempts: number;
  failedAttempts: number;
  lastErrorCode?: number;
  lastErrorMessage?: string;
}

export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

/**
 * AttemptRepository tracks taskResultDeliveryAttempt logs, latency measurements,
 * HTTP status codes distribution, and error distributions.
 */
export class AttemptRepository extends BaseRepository<TaskResultDeliveryAttempt, Prisma.TaskResultDeliveryAttemptCreateInput, Prisma.TaskResultDeliveryAttemptUpdateInput> {
  constructor(prisma: PrismaClient, logger: Logger) {
    super(prisma, logger, 'taskResultDeliveryAttempt');
  }

  // --- Implement BaseRepository Abstract Methods ---

  public async getAll(): Promise<TaskResultDeliveryAttempt[]> {
    return this.findMany();
  }

  public async getById(id: string): Promise<TaskResultDeliveryAttempt | null> {
    const record = await this.findUnique({ id });
    if (!record) {
      throw new NotFoundError(`TaskResultDeliveryAttempt not found with id: ${id}`);
    }
    return record;
  }

  public async create(
    data: Prisma.TaskResultDeliveryAttemptCreateInput,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<TaskResultDeliveryAttempt> {
    const { tx, auditCtx } = this.parseTxAndContext(txOrContext, context);
    return this.executeQuery(async () => {
      const client = tx || this.prisma;
      const created = await client.taskResultDeliveryAttempt.create({ data });
      await this.logAudit(tx, 'DELIVERY_ATTEMPT_CREATED', created.id, 'CREATE', data, auditCtx);
      return created;
    });
  }

  public async update(
    id: string,
    data: Prisma.TaskResultDeliveryAttemptUpdateInput,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<TaskResultDeliveryAttempt> {
    const { tx, auditCtx } = this.parseTxAndContext(txOrContext, context);
    return this.executeQuery(async () => {
      const client = tx || this.prisma;
      const updated = await client.taskResultDeliveryAttempt.update({
        where: { id },
        data,
      });
      await this.logAudit(tx, 'DELIVERY_ATTEMPT_UPDATED', id, 'UPDATE', data, auditCtx);
      return updated;
    });
  }

  public async delete(
    id: string,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<TaskResultDeliveryAttempt> {
    const { tx, auditCtx } = this.parseTxAndContext(txOrContext, context);
    return this.executeQuery(async () => {
      const client = tx || this.prisma;
      const deleted = await client.taskResultDeliveryAttempt.delete({
        where: { id },
      });
      await this.logAudit(tx, 'DELIVERY_ATTEMPT_DELETED', id, 'DELETE', null, auditCtx);
      return deleted;
    });
  }

  /**
   * Records a delivery attempt.
   */
  public async recordAttempt(
    deliveryId: string,
    attemptNumber: number,
    data: { responseStatus?: number | null; responseTimeMs?: number | null; errorMessage?: string | null }
  ): Promise<TaskResultDeliveryAttempt> {
    if (data.responseStatus !== undefined && data.responseStatus !== null) {
      if (data.responseStatus < 100 || data.responseStatus > 599) {
        throw new ValidationError('Invalid HTTP response status range');
      }
    }
    return this.executeQuery(async () => {
      // Create Attempt Log Record
      const attempt = await this.prisma.taskResultDeliveryAttempt.create({
        data: {
          deliveryId,
          attemptNumber,
          responseStatus: data.responseStatus ?? null,
          responseTimeMs: data.responseTimeMs ?? 0,
          errorMessage: data.errorMessage ?? null,
          requestHeaders: {},
          responseHeaders: {},
        },
      });

      // Update Parent Delivery retryCount and lastError
      try {
        await this.prisma.taskResultDelivery.update({
          where: { id: deliveryId },
          data: {
            retryCount: attemptNumber,
            lastError: data.errorMessage ?? null,
            lastAttemptAt: new Date(),
          },
        });
      } catch (err: any) {
        if (err.code !== 'P2025') {
          throw err;
        }
      }

      return attempt;
    });
  }

  // --- Specific Repository Methods ---

  /**
   * Retrieves all attempts associated with a delivery, ordered chronologically by attemptNumber.
   */
  public async findByDeliveryId(deliveryId: string): Promise<TaskResultDeliveryAttempt[]> {
    return this.findMany({ deliveryId }, { orderBy: 'attemptNumber', order: 'asc' });
  }

  /**
   * Looks up the single latest attempt recorded for a delivery (highest attemptNumber).
   */
  public async getLatestAttempt(deliveryId: string): Promise<TaskResultDeliveryAttempt | null> {
    return this.findFirst({ deliveryId }, { orderBy: 'attemptNumber', order: 'desc' } as any);
  }

  /**
   * Queries chronological attempt history records with options limits.
   */
  public async getAttemptHistory(deliveryId: string, limit?: number): Promise<TaskResultDeliveryAttempt[]> {
    return this.findMany(
      { deliveryId },
      { orderBy: 'timestamp', order: 'desc', page: 1, limit: limit || 10 }
    );
  }

  /**
   * Compiles error status count metrics for a delivery ID.
   */
  public async getFailureStats(deliveryId: string): Promise<FailureStats> {
    return this.executeQuery(async () => {
      const attempts = await this.findByDeliveryId(deliveryId);
      const totalAttempts = attempts.length;
      
      // Failed attempts count: attempts that resulted in status >= 400 or has an error message
      const failedAttempts = attempts.filter(
        (att) => (att.responseStatus && att.responseStatus >= 400) || att.errorMessage
      ).length;

      const latest = attempts[attempts.length - 1];

      return {
        totalAttempts,
        failedAttempts,
        lastErrorCode: latest?.responseStatus || undefined,
        lastErrorMessage: latest?.errorMessage || undefined,
      };
    });
  }

  /**
   * Counts attempts matching a targeted HTTP status response code.
   */
  public async countByStatusCode(statusCode: number): Promise<number> {
    return this.count({ responseStatus: statusCode });
  }

  /**
   * Computes occurrence counts of specific error message structures within a time range.
   */
  public async getErrorDistribution(timeRange: TimeRange): Promise<Record<string, number>> {
    return this.executeQuery(async () => {
      const attempts = await this.prisma.taskResultDeliveryAttempt.findMany({
        where: {
          timestamp: {
            gte: timeRange.startDate,
            lte: timeRange.endDate,
          },
          errorMessage: {
            not: null,
          },
        },
      });

      const distribution: Record<string, number> = {};
      attempts.forEach((att) => {
        const msg = att.errorMessage || 'Unknown Error';
        distribution[msg] = (distribution[msg] || 0) + 1;
      });

      return distribution;
    });
  }
}
export { TaskResultDeliveryAttempt as Attempt };
export { AttemptRepository as PrismaAttemptRepository };
