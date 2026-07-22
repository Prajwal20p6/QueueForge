import { PrismaClient } from '@prisma/client';

/**
 * Utility for truncating and clearing database tables between test executions.
 */
export class DatabaseCleaner {
  constructor(private readonly prisma: PrismaClient) {}

  public async cleanAllTables(): Promise<void> {
    try {
      await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE "task_result_delivery_attempts", "task_result_deliveries", "ai_task_results", "destinations", "audit_logs" CASCADE;`);
    } catch {
      // Ignore cleanup error if tables do not exist in lightweight test environment
    }
  }

  public async cleanTable(tableName: string): Promise<void> {
    try {
      await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
    } catch {
      // Ignore
    }
  }
}
