import { PrismaClient } from '@prisma/client';

/**
 * Database state assertions helper.
 */
export class DatabaseAssertions {
  public static async assertTableHasRows(prisma: PrismaClient, tableName: string, minCount = 1): Promise<void> {
    const res: any[] = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}";`);
    const count = parseInt(res[0]?.count || '0', 10);
    if (count < minCount) {
      throw new Error(`Expected table "${tableName}" to have at least ${minCount} rows, but got ${count}`);
    }
  }

  public static async assertTableEmpty(prisma: PrismaClient, tableName: string): Promise<void> {
    const res: any[] = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}";`);
    const count = parseInt(res[0]?.count || '0', 10);
    if (count !== 0) {
      throw new Error(`Expected table "${tableName}" to be empty, but got ${count} rows`);
    }
  }
}
