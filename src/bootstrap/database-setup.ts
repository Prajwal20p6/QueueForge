import { PrismaClient } from '@prisma/client';
import { Config } from '../config';
import { Logger } from '../observability/logging/logger';
import { initializeDatabase } from '../infrastructure/database/client';
import { runMigrations } from './migrations';
import { seedDatabase } from './seeding';

/**
 * Initializes, verifies, runs migrations and optionally seeds the Prisma client instance.
 *
 * @param config - The application unified configuration object.
 * @param logger - The application logger.
 * @returns An initialized and validated PrismaClient instance.
 */
export async function setupDatabase(config: Config, logger: Logger): Promise<PrismaClient> {
  logger.info('[DatabaseSetup] Initializing Prisma client connection pool...');
  
  // 1. Initialize Prisma client connection
  const prisma = await initializeDatabase();

  const env = config.app?.environment || 'development';
  logger.info(`[DatabaseSetup] Connection established. Environment: ${env}`);

  // 2. Run migrations automatically in dev and test environments
  if (env === 'development' || env === 'test') {
    logger.info('[DatabaseSetup] Running automatic database migrations...');
    await runMigrations(prisma, logger, env);
  }

  // 3. Verify required tables exist by running a simple count query
  logger.info('[DatabaseSetup] Verifying schema and required tables existence...');
  try {
    await prisma.destination.count();
    await prisma.aiTaskResult.count();
    await prisma.taskResultDelivery.count();
    logger.info('[DatabaseSetup] Database schema verification completed successfully.');
  } catch (err: any) {
    logger.error('[DatabaseSetup] Database schema verification failed. Required tables are missing.', err);
    throw new Error(`Database schema verification failed: ${err.message}`);
  }

  // 4. Run seeding in development environment
  if (env === 'development') {
    logger.info('[DatabaseSetup] Triggering database seeding script...');
    await seedDatabase(prisma, logger);
  }

  return prisma;
}
