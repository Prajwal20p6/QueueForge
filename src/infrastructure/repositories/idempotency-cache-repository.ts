import { PrismaClient, Prisma, IdempotencyCache } from '@prisma/client';
import { Logger } from 'winston';
import { BaseRepository, AuditContext } from './base-repository';
import { NotFoundError } from '../../shared/errors/not-found-error';

export interface CacheEntry {
  compositeKey: string;
  deliveryId: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * IdempotencyCacheRepository implements connection layer tracking for deduplication caches
 * with lazy TTL expiration on reads.
 */
export class IdempotencyCacheRepository extends BaseRepository<IdempotencyCache, Prisma.IdempotencyCacheCreateInput, Prisma.IdempotencyCacheUpdateInput> {
  constructor(prisma: PrismaClient, logger: Logger) {
    super(prisma, logger, 'idempotencyCache');
  }

  // --- Implement BaseRepository Abstract Methods ---

  public async getAll(): Promise<IdempotencyCache[]> {
    return this.findMany();
  }

  public async getById(id: string): Promise<IdempotencyCache | null> {
    const record = await this.findUnique({ compositeKey: id });
    if (!record) {
      throw new NotFoundError(`IdempotencyCache entry not found with compositeKey: ${id}`);
    }
    return record;
  }

  public async create(
    data: Prisma.IdempotencyCacheCreateInput,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<IdempotencyCache> {
    const { tx } = this.parseTxAndContext(txOrContext, context);
    return this.executeQuery(async () => {
      const client = tx || this.prisma;
      return await client.idempotencyCache.create({ data });
    });
  }

  public async update(
    id: string,
    data: Prisma.IdempotencyCacheUpdateInput,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<IdempotencyCache> {
    const { tx } = this.parseTxAndContext(txOrContext, context);
    return this.executeQuery(async () => {
      const client = tx || this.prisma;
      return await client.idempotencyCache.update({
        where: { compositeKey: id },
        data,
      });
    });
  }

  /**
   * Helper mapping delete abstract method to handle ID string queries.
   */
  public async deleteById(id: string): Promise<IdempotencyCache> {
    return this.executeQuery(async () => {
      return await this.prisma.idempotencyCache.delete({
        where: { compositeKey: id },
      });
    });
  }

  public async delete(
    taskResultIdOrKey: string,
    destinationIdOrTx?: string | Prisma.TransactionClient | AuditContext,
    _context?: AuditContext
  ): Promise<IdempotencyCache> {
    if (typeof destinationIdOrTx === 'string') {
      const key = this.getCompositeKey(taskResultIdOrKey, destinationIdOrTx);
      return this.deleteById(key);
    }
    return this.deleteById(taskResultIdOrKey);
  }

  // --- Specific Repository Methods ---

  /**
   * Looks up a cached record, deleting it dynamically if expired (lazy TTL).
   */
  public async findByCompositeKey(taskResultId: string, destinationId: string): Promise<CacheEntry | null> {
    const key = this.getCompositeKey(taskResultId, destinationId);
    const record = await this.findUnique({ compositeKey: key });
    if (!record) return null;

    // Lazy TTL check
    if (record.expiresAt <= new Date()) {
      this.logger.debug(`[IdempotencyCacheRepository] TTL expired for key ${key}. Clearing cache entry.`);
      await this.deleteById(key);
      return null;
    }

    return record;
  }

  /**
   * Adds or updates a cache entry with expiry TTL tracking.
   */
  public async set(taskResultId: string, destinationId: string, deliveryId: string, ttlSeconds: number): Promise<void> {
    const key = this.getCompositeKey(taskResultId, destinationId);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await this.executeQuery(async () => {
      await this.prisma.idempotencyCache.upsert({
        where: { compositeKey: key },
        update: {
          deliveryId,
          expiresAt,
        },
        create: {
          compositeKey: key,
          deliveryId,
          expiresAt,
        },
      });
    });
  }

  /**
   * Asserts if cached entry is active and has not expired.
   */
  public async exists(taskResultId: string, destinationIdOrTx?: string | Prisma.TransactionClient): Promise<boolean> {
    if (typeof destinationIdOrTx === 'string') {
      const entry = await this.findByCompositeKey(taskResultId, destinationIdOrTx);
      return entry !== null;
    }
    // Compliance signature with BaseRepository
    const record = await this.findUnique({ compositeKey: taskResultId }, destinationIdOrTx);
    return record !== null;
  }

  /**
   * Deletes expired cache entries (cron maintenance job).
   */
  public async deleteExpired(): Promise<number> {
    // Directly run deleteMany bypassing blocked BaseRepository deleteMany
    return this.executeQuery(async () => {
      const res = await this.prisma.idempotencyCache.deleteMany({
        where: {
          expiresAt: {
            lte: new Date(),
          },
        },
      });
      return res.count;
    });
  }

  /**
   * Formats the composite identifier key string.
   */
  public getCompositeKey(taskResultId: string, destinationId: string): string {
    return `${taskResultId}:${destinationId}`;
  }
}
