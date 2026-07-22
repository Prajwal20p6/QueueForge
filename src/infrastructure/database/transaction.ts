import { PrismaClient, Prisma } from '@prisma/client';
import { Logger } from 'winston';
import { ConflictError } from '../../shared/errors/conflict-error';
import { ValidationError } from '../../shared/errors/validation-error';
import { InternalError } from '../../shared/errors/internal-error';
import { InfrastructureError } from '../../shared/errors/infrastructure-error';

export enum IsolationLevel {
  READ_UNCOMMITTED = 'ReadUncommitted',
  READ_COMMITTED = 'ReadCommitted',
  REPEATABLE_READ = 'RepeatableRead',
  SERIALIZABLE = 'Serializable',
}

export interface Transaction {
  client: Prisma.TransactionClient;
  commit: () => void;
  rollback: (err?: any) => void;
  done: Promise<void>;
}

/**
 * TransactionManager class orchestrates database transactions, isolation levels,
 * deadlock retries, and errors categorization.
 */
export class TransactionManager {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger
  ) {}

  /**
   * Runs a callback block inside an active transaction.
   */
  public async run<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
    timeout = 30000
  ): Promise<T> {
    return this.runWithRetry(callback, undefined, timeout);
  }

  /**
   * Runs a transaction block with a specified SQL isolation level constraint.
   */
  public async runWithIsolation<T>(
    level: IsolationLevel,
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
    timeout = 30000
  ): Promise<T> {
    return this.runWithRetry(callback, level, timeout);
  }

  /**
   * Manually opens a transaction connection, yielding control handle.
   */
  public async beginTransaction(): Promise<Transaction> {
    this.logger.debug('[TransactionManager] Starting manual transaction');
    
    let commitFn!: () => void;
    let rollbackFn!: (err?: any) => void;

    const done = new Promise<void>((resolve, reject) => {
      commitFn = resolve;
      rollbackFn = reject;
    });

    const txClientPromise = new Promise<Prisma.TransactionClient>((resolveClient, rejectClient) => {
      this.prisma.$transaction(async (tx) => {
        resolveClient(tx);
        // Suspend transaction block until outer commit or rollback is invoked
        try {
          await done;
        } catch (err) {
          // Throw to force interactive transaction rollback
          throw err || new Error('Transaction rollback forced');
        }
      }).catch((err) => {
        // Catch any internal prisma failures
        rejectClient(err);
      });
    });

    try {
      const client = await txClientPromise;
      return {
        client,
        commit: commitFn,
        rollback: rollbackFn,
        done,
      };
    } catch (err: any) {
      throw this.handleError(err);
    }
  }

  /**
   * Commits the open manual transaction.
   */
  public async commitTransaction(tx: Transaction): Promise<void> {
    this.logger.debug('[TransactionManager] Committing manual transaction');
    tx.commit();
    // Wait for the done promise execution path to resolve
    await tx.done.catch(() => {});
  }

  /**
   * Rolls back the open manual transaction.
   */
  public async rollbackTransaction(tx: Transaction): Promise<void> {
    this.logger.debug('[TransactionManager] Rolling back manual transaction');
    tx.rollback(new Error('Manual transaction rollback'));
    try {
      await tx.done;
    } catch {
      // Ignored: rollback rejection expected
    }
  }

  /**
   * Internal runner executing transaction wrapper with deadlock detection retries.
   */
  private async runWithRetry<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
    isolationLevel?: IsolationLevel,
    timeout = 30000
  ): Promise<T> {
    const maxRetries = 3;
    let attempt = 0;
    let delay = 100;

    while (attempt < maxRetries) {
      try {
        const txOptions: any = { timeout };
        if (isolationLevel) {
          txOptions.isolationLevel = isolationLevel as Prisma.TransactionIsolationLevel;
        }

        return await this.prisma.$transaction(callback, txOptions);
      } catch (err: any) {
        attempt++;
        const isDeadlock =
          err.code === 'P2034' ||
          err.message?.toLowerCase().includes('deadlock') ||
          err.message?.toLowerCase().includes('serialization');

        if (isDeadlock && attempt < maxRetries) {
          this.logger.warn(`[TransactionManager] Deadlock detected. Retrying transaction (${attempt}/${maxRetries}) in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }

        throw this.handleError(err);
      }
    }

    throw new InternalError('Transaction failed after maximum retries');
  }

  /**
   * Maps database exceptions to application domain errors.
   */
  private handleError(err: any): Error {
    if (err.code === 'P2002') {
      const targetFields = err.meta?.target ? ` fields: (${err.meta.target.join(', ')})` : '';
      return new ConflictError(`Database record already exists due to unique constraint violation.${targetFields}`);
    }

    if (err.code === 'P2003') {
      const field = err.meta?.field_name ? ` field: ${err.meta.field_name}` : '';
      return new ValidationError(`Database reference integrity constraint violation.${field}`);
    }

    if (err instanceof ConflictError || err instanceof ValidationError || err instanceof InternalError || err instanceof InfrastructureError) {
      return err;
    }

    return new InfrastructureError(`Transaction query execution failed: ${err.message}`);
  }
}

export async function runInTransaction<T>(
  prisma: PrismaClient,
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: { maxRetries?: number; timeout?: number }
): Promise<T> {
  const manager = new TransactionManager(prisma, console as any);
  // Support options block or fallback to defaults
  const timeout = options?.timeout ?? 30000;
  return manager.run(callback, timeout);
}

export async function runWithIsolation<T>(
  prisma: PrismaClient,
  isolationLevel: IsolationLevel,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  const manager = new TransactionManager(prisma, console as any);
  return manager.runWithIsolation(isolationLevel, callback);
}
