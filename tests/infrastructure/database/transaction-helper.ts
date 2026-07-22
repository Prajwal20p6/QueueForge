import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Utility executing test operations inside isolated transactions.
 */
export class TransactionHelper {
  constructor(private readonly prisma: PrismaClient) {}

  public async runInTransaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(async tx => {
      return callback(tx);
    });
  }
}
