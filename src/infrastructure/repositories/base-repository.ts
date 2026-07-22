import { PrismaClient, Prisma } from '@prisma/client';
import { Logger } from 'winston';
import { NotFoundError } from '../../shared/errors/not-found-error';
import { ValidationError } from '../../shared/errors/validation-error';
import { ConflictError } from '../../shared/errors/conflict-error';
import { InternalError } from '../../shared/errors/internal-error';

export interface AuditContext {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

export interface FindOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
  include?: any;
  select?: any;
}

/**
 * Abstract Generic BaseRepository implementing unified standard CRUD, validation,
 * error mapping, and transaction-aware queries.
 */
export abstract class BaseRepository<T, CreateInput = any, UpdateInput = any> {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly logger: Logger,
    protected readonly modelName: string
  ) {}

  /**
   * Returns the dynamic Prisma model delegate for executing queries.
   */
  protected get modelDelegate(): any {
    return (this.prisma as any)[this.modelName];
  }

  // --- Abstract Methods to be implemented by sub-classes ---
  public abstract getAll(): Promise<T[]>;
  public abstract getById(id: string): Promise<T | null>;
  public abstract create(
    data: CreateInput,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<T>;
  public abstract update(
    id: string,
    data: UpdateInput,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<T>;
  public abstract delete(
    id: string,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<T>;

  protected parseTxAndContext(
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): { tx?: Prisma.TransactionClient; auditCtx?: AuditContext } {
    let tx: Prisma.TransactionClient | undefined;
    let auditCtx = context;

    if (txOrContext) {
      if (typeof txOrContext === 'object' && ('$executeRaw' in txOrContext || '$queryRaw' in txOrContext)) {
        tx = txOrContext as Prisma.TransactionClient;
      } else {
        auditCtx = txOrContext as AuditContext;
      }
    }

    return { tx, auditCtx };
  }

  protected async logAudit(
    tx: Prisma.TransactionClient | undefined,
    eventType: string,
    entityId: string | null,
    action: string,
    changes: any,
    context?: AuditContext
  ): Promise<void> {
    try {
      const client = tx || this.prisma;
      await client.auditLog.create({
        data: {
          eventType,
          entityType: this.modelName,
          entityId: entityId || '',
          actorId: context?.actorId || 'system',
          ipAddress: context?.ipAddress || null,
          userAgent: context?.userAgent || null,
          action,
          changes: changes || {},
        },
      });
    } catch (err: any) {
      this.logger.error(`[BaseRepository] Audit log creation failed: ${err.message}`);
    }
  }

  // --- Concrete General Repository CRUD Methods ---

  /**
   * Asserts if record exists by primary key identifier.
   */
  public async exists(id: string, tx?: Prisma.TransactionClient): Promise<boolean> {
    this.logger.debug(`[${this.modelName}Repository] exists: ${id}`);
    const record = await this.findUnique({ id } as any, tx);
    return record !== null && record !== undefined;
  }

  /**
   * Looks up a record by primary key identifier.
   */
  public async findById(id: string, tx?: Prisma.TransactionClient): Promise<T | null> {
    this.logger.debug(`[${this.modelName}Repository] findById: ${id}`);
    return this.findUnique({ id } as any, tx);
  }

  /**
   * Finds the first active record matching custom filters.
   */
  public async findOne(where: any, tx?: Prisma.TransactionClient): Promise<T | null> {
    this.logger.debug(`[${this.modelName}Repository] findOne`);
    return this.findFirst(where, undefined, tx);
  }

  /**
   * Counts the amount of database rows matching target criteria.
   */
  public async count(where: any = {}, tx?: Prisma.TransactionClient): Promise<number> {
    this.logger.debug(`[${this.modelName}Repository] count`);
    return this.executeQuery(async () => {
      const client = tx ? (tx as any)[this.modelName] : this.modelDelegate;
      return await client.count({ where });
    });
  }

  /**
   * Queries records supporting sorting, pagination, and relation selections.
   */
  public async findMany(
    where: any = {},
    options?: FindOptions,
    tx?: Prisma.TransactionClient
  ): Promise<T[] & { data: T[]; total: number; hasMore: boolean }> {
    this.logger.debug(`[${this.modelName}Repository] findMany`);
    return this.executeQuery(async () => {
      const client = tx ? (tx as any)[this.modelName] : this.modelDelegate;
      const queryArgs: any = { where };
      let take = 100;
      let skip = 0;

      if (options) {
        if (options.page && options.limit) {
          take = Math.max(1, options.limit);
          skip = Math.max(0, (options.page - 1) * take);
          queryArgs.take = take;
          if (skip > 0) {
            queryArgs.skip = skip;
          }
        }

        if (options.orderBy) {
          queryArgs.orderBy = {
            [options.orderBy]: options.order || 'desc',
          };
        }

        if (options.include) {
          queryArgs.include = options.include;
        } else if (options.select) {
          queryArgs.select = options.select;
        }
      }

      const records = await client.findMany(queryArgs) as T[];
      const total = await client.count({ where });
      const hasMore = skip + records.length < total;

      // Hybrid array object: supports both direct array calls and object property destructuring
      const hybridArray = [...records] as any;
      Object.defineProperty(hybridArray, 'data', { value: records, enumerable: true });
      Object.defineProperty(hybridArray, 'total', { value: total, enumerable: true });
      Object.defineProperty(hybridArray, 'hasMore', { value: hasMore, enumerable: true });

      return hybridArray as any;
    });
  }

  /**
   * Finds first record matching condition.
   */
  public async findFirst(
    where: any,
    options?: FindOptions,
    tx?: Prisma.TransactionClient
  ): Promise<T | null> {
    this.logger.debug(`[${this.modelName}Repository] findFirst`);
    return this.executeQuery(async () => {
      const client = tx ? (tx as any)[this.modelName] : this.modelDelegate;
      const queryArgs: any = { where };
      if (options) {
        if (options.include) {
          queryArgs.include = options.include;
        } else if (options.select) {
          queryArgs.select = options.select;
        }
      }
      return await client.findFirst(queryArgs);
    });
  }

  /**
   * Finds unique record matching unique properties.
   */
  public async findUnique(where: any, tx?: Prisma.TransactionClient): Promise<T | null> {
    this.logger.debug(`[${this.modelName}Repository] findUnique`);
    return this.executeQuery(async () => {
      const client = tx ? (tx as any)[this.modelName] : this.modelDelegate;
      return await client.findUnique({ where });
    });
  }

  /**
   * Bulk inserts multiple records.
   */
  public async createMany(data: CreateInput[], tx?: Prisma.TransactionClient): Promise<T[]> {
    this.logger.debug(`[${this.modelName}Repository] createMany (Count: ${data.length})`);
    return this.executeQuery(async () => {
      // PostgreSQL Prisma createMany returns { count: number }
      // To ensure we return typed arrays we run them sequentially inside a transaction or return them.
      // If we use createMany, we get counts, but let's implement standard Prisma transaction insert.
      const records = [];
      const runner = tx || this.prisma;
      for (const item of data) {
        const created = await (runner as any)[this.modelName].create({ data: item });
        records.push(created);
      }
      return records;
    });
  }

  /**
   * Updates multiple records matching filters.
   */
  public async updateMany(where: any, data: UpdateInput, tx?: Prisma.TransactionClient): Promise<number> {
    this.logger.debug(`[${this.modelName}Repository] updateMany`);
    return this.executeQuery(async () => {
      const client = tx ? (tx as any)[this.modelName] : this.modelDelegate;
      const res = await client.updateMany({ where, data });
      return res.count;
    });
  }

  /**
   * Deletes multiple records matching filters.
   */
  public async deleteMany(where: any, tx?: Prisma.TransactionClient): Promise<number> {
    this.logger.debug(`[${this.modelName}Repository] deleteMany`);
    return this.executeQuery(async () => {
      const client = tx ? (tx as any)[this.modelName] : this.modelDelegate;
      const res = await client.deleteMany({ where });
      return res.count;
    });
  }

  /**
   * Wrapper catching database exceptions and translating to domain errors.
   */
  protected async executeQuery<R>(op: () => Promise<R>): Promise<R> {
    try {
      return await op();
    } catch (err: any) {
      throw this.mapDatabaseError(err);
    }
  }

  /**
   * Core error mapping logic translation block.
   */
  protected mapDatabaseError(err: any): Error {
    if (err instanceof NotFoundError || err instanceof ValidationError || err instanceof ConflictError || err instanceof InternalError) {
      return err;
    }

    // Prisma specific error code mappings
    if (err.code === 'P2002') {
      const fields = err.meta?.target ? ` (${err.meta.target.join(', ')})` : '';
      return new ConflictError(`Database constraint conflict: Duplicate key value violates unique constraint${fields}`);
    }

    if (err.code === 'P2003') {
      const field = err.meta?.field_name ? ` field: ${err.meta.field_name}` : '';
      return new ValidationError(`Reference integrity check failed: Foreign key violates constraint${field}`);
    }

    if (err.code === 'P2025') {
      return new NotFoundError(`Record not found: ${err.meta?.cause || err.message}`);
    }

    return new InternalError(`Database operation failed: ${err.message}`);
  }
}
