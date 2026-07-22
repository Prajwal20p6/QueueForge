import { PrismaClient } from '@prisma/client';
import { Logger } from '../observability/logging/logger';
import { execSync } from 'child_process';
import path from 'path';

/**
 * Runs Prisma migrations using the schema file to ensure database tables are up to date.
 *
 * @param prisma - PrismaClient instance.
 * @param logger - The logger wrapper.
 * @param environment - Current environment name.
 * @returns Object indicating status of migration run.
 */
export async function runMigrations(
  prisma: PrismaClient,
  logger: Logger,
  environment: string
): Promise<{ pending: number; executed: string[] }> {
  logger.info(`[Migrations] Triggering schema migrations deployment in: ${environment}`);

  try {
    // Locate prisma schema file path relative to workspace root
    const schemaPath = path.resolve(process.cwd(), 'prisma', 'schema.prisma');
    
    logger.info(`[Migrations] Executing prisma migrate deploy against: ${schemaPath}`);

    // Exec deploy migrations command
    const output = execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
      encoding: 'utf-8',
    });

    logger.info(`[Migrations] Command output:\n${output}`);

    // Verify migrations were recorded
    const migrationsRecorded = await prisma.$queryRaw<any[]>`SELECT * FROM _prisma_migrations`;
    const executed = migrationsRecorded.map(m => m.migration_name);

    logger.info(`[Migrations] Database is up-to-date. Total executed migrations: ${executed.length}`);

    return {
      pending: 0,
      executed,
    };
  } catch (err: any) {
    logger.error('[Migrations] Database migrations execution failed!', err);
    logger.error(
      '[Migrations] Recovery Guidance: Verify database server connectivity, credential permissions, or manually run "npx prisma migrate deploy" from terminal.'
    );
    throw err;
  }
}
