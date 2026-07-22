import { PrismaClient, Prisma, AiTaskResult } from '@prisma/client';
import { Logger } from 'winston';
import { BaseRepository, AuditContext } from './base-repository';
import { NotFoundError } from '../../shared/errors/not-found-error';
import { ValidationError } from '../../shared/errors/validation-error';

export interface LineageData {
  results: AiTaskResult[];
  deliveries: any[];
}

/**
 * ResultRepository manages queries for AiTaskResult records, indexing, and compliance GDPR deletions.
 */
export class ResultRepository extends BaseRepository<AiTaskResult, Prisma.AiTaskResultCreateInput, Prisma.AiTaskResultUpdateInput> {
  constructor(prisma: PrismaClient, logger: Logger) {
    super(prisma, logger, 'aiTaskResult');
  }

  // --- Implement BaseRepository Abstract Methods ---

  public async getAll(): Promise<AiTaskResult[]> {
    return this.findMany();
  }

  public async getById(id: string): Promise<AiTaskResult | null> {
    const record = await this.findUnique({ id });
    if (!record) {
      throw new NotFoundError(`AiTaskResult not found with id: ${id}`);
    }
    return record;
  }

  public async create(
    data: Prisma.AiTaskResultCreateInput,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<AiTaskResult> {
    const { tx, auditCtx } = this.parseTxAndContext(txOrContext, context);
    return this.executeQuery(async () => {
      const client = tx || this.prisma;
      const created = await client.aiTaskResult.create({ data });
      await this.logAudit(tx, 'TASK_RESULT_CREATED', created.id, 'CREATE', data, auditCtx);
      return created;
    });
  }

  public async update(
    id: string,
    data: Prisma.AiTaskResultUpdateInput,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<AiTaskResult> {
    const { tx, auditCtx } = this.parseTxAndContext(txOrContext, context);
    return this.executeQuery(async () => {
      const client = tx || this.prisma;
      const updated = await client.aiTaskResult.update({
        where: { id },
        data,
      });
      await this.logAudit(tx, 'TASK_RESULT_UPDATED', id, 'UPDATE', data, auditCtx);
      return updated;
    });
  }

  public async delete(
    id: string,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<AiTaskResult> {
    const { tx, auditCtx } = this.parseTxAndContext(txOrContext, context);
    return this.executeQuery(async () => {
      const client = tx || this.prisma;
      const deleted = await client.aiTaskResult.delete({
        where: { id },
      });
      await this.logAudit(tx, 'TASK_RESULT_DELETED', id, 'DELETE', null, auditCtx);
      return deleted;
    });
  }

  // --- Specific Repository Methods ---

  public async createResult(
    data: Prisma.AiTaskResultCreateInput,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<AiTaskResult> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.emailId)) {
      throw new ValidationError('Invalid email format');
    }
    return this.create(data, txOrContext, context);
  }

  public async findPendingResults(limit: number): Promise<AiTaskResult[]> {
    return this.executeQuery(async () => {
      return await this.prisma.aiTaskResult.findMany({ take: limit });
    });
  }

  public async getResultStats(): Promise<{ total: number; averageConfidence: number; byAgent: Record<string, number> }> {
    return this.executeQuery(async () => {
      const records = await this.prisma.aiTaskResult.findMany();
      const total = records.length;
      if (total === 0) {
        return { total: 0, averageConfidence: 0, byAgent: {} };
      }
      let sumConfidence = 0;
      const byAgent: Record<string, number> = {};
      records.forEach((r) => {
        sumConfidence += r.confidenceScore;
        byAgent[r.agentId] = (byAgent[r.agentId] || 0) + 1;
      });
      return {
        total,
        averageConfidence: sumConfidence / total,
        byAgent,
      };
    });
  }

  /**
   * Finds all AI task results associated with a specific email identifier.
   */
  public async findByEmailId(emailId: string): Promise<AiTaskResult[]> {
    return this.findMany({ emailId });
  }

  /**
   * Finds all AI task results associated with a specific agent identifier.
   */
  public async findByAgentId(agentId: string): Promise<AiTaskResult[]> {
    return this.findMany({ agentId });
  }

  /**
   * Queries results within a specific creation date range.
   */
  public async findByDateRange(startDate: Date, endDate: Date): Promise<AiTaskResult[]> {
    return this.findMany({
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    });
  }

  /**
   * Looks up a task result by ID, eager loading its associated delivery records.
   */
  public async findWithDeliveries(id: string): Promise<AiTaskResult | null> {
    return this.findFirst({
      id,
    }, {
      include: {
        deliveries: {
          include: {
            attempts: {
              orderBy: { attemptNumber: 'asc' },
            },
          },
        },
      },
    } as any);
  }

  /**
   * Retrieves complete lineage history mapping results, destinations, and attempts for audits.
   */
  public async getLineage(emailId: string): Promise<LineageData> {
    const results = await this.findByEmailId(emailId);
    const resultIds = results.map((r) => r.id);
    const deliveries = await this.prisma.taskResultDelivery.findMany({
      where: {
        taskResultId: { in: resultIds },
      },
      include: {
        attempts: {
          orderBy: { attemptNumber: 'asc' },
        },
      },
    });
    return { results, deliveries };
  }

  /**
   * Counts task results created for a specific emailId.
   */
  public async countByEmailId(emailId: string): Promise<number> {
    return this.count({ emailId });
  }

  /**
   * Counts results that have at least one delivery with the specified status.
   */
  public async countByStatus(status: string): Promise<number> {
    return this.count({
      deliveries: {
        some: {
          status: status as any,
        },
      },
    });
  }

  /**
   * Bulk deletes results older than target date (GDPR Compliance).
   */
  public async deleteOlderThan(date: Date): Promise<number> {
    return this.deleteMany({
      createdAt: {
        lt: date,
      },
    });
  }
}
