import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { DatabaseConfig } from '../config/database.config';
import { Repositories, initializeRepositories } from './repositories';
import {
  connectDatabase,
  getPrismaClient,
  ConnectionPoolManager,
  TransactionManager,
  MigrationRunner,
} from './database';


export interface DatabaseModule {
  prisma: PrismaClient;
  repositories: Repositories;
  connectionPool: ConnectionPoolManager;
  transactions: TransactionManager;
}

/**
 * Boots and initializes the complete Database Infrastructure Module, verifying connectivity,
 * executing migrations in development/staging environments, running database seeds,
 * and exposing unified Repository singletons.
 */
export async function initializeDatabaseModule(
  config: DatabaseConfig,
  logger: Logger
): Promise<DatabaseModule> {
  logger.info('[DatabaseModule] Starting initialization...');

  try {
    // a. Connect Prisma client and b. Verify connection
    await connectDatabase(config);
    const prismaClient = getPrismaClient();

    const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
    const isDevOrStaging = nodeEnv === 'development' || nodeEnv === 'dev' || nodeEnv === 'staging';

    // c. Run migrations if dev/staging
    if (isDevOrStaging) {
      const runner = new MigrationRunner(logger);
      await runner.runMigrations(prismaClient);
    }

    // d. Seed database if dev
    if (nodeEnv === 'development' || nodeEnv === 'dev') {
      const { seed: runSeed } = require('../../prisma/seed');
      await runSeed();
    }

    // e. Create RepositoryFactory and initialize repositories
    const repositories = await initializeRepositories(prismaClient, logger);

    // f. Create ConnectionPoolManager
    const connectionPool = new ConnectionPoolManager(config, logger);

    // g. Create TransactionManager
    const transactions = new TransactionManager(prismaClient, logger);

    // h. Log success
    logger.info('[DatabaseModule] Database initialized successfully');

    return {
      prisma: prismaClient,
      repositories,
      connectionPool,
      transactions,
    };
  } catch (err: any) {
    logger.error(`[DatabaseModule] Critical database module initialization failure: ${err.message}`, err);
    throw err;
  }
}
