import { PrismaClient } from '@prisma/client';
import { getPrismaClient, connectDatabase, disconnectDatabase } from '../../../src/infrastructure/database/prisma-client';
import { getTestConfig } from '../../helpers/test-config';

/**
 * Helper class providing setup, teardown, and stats for PostgreSQL testing.
 */
export class DatabaseHelper {
  public static async createTestDatabase(): Promise<PrismaClient> {
    const config = getTestConfig();
    await connectDatabase(config.database as any);
    return getPrismaClient();
  }

  public static async setupDatabase(): Promise<void> {
    const config = getTestConfig();
    await connectDatabase(config.database as any);
  }

  public static async teardownDatabase(): Promise<void> {
    await disconnectDatabase();
  }
}
