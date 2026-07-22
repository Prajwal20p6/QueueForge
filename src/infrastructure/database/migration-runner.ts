import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { InternalError } from '../../shared/errors/internal-error';

export interface MigrationStatus {
  appliedCount: number;
  pendingCount: number;
  applied: string[];
  pending: string[];
}

/**
 * MigrationRunner automatically discovers pending database migrations
 * and executes deployment commands in dev/staging environments.
 */
export class MigrationRunner {
  constructor(private readonly logger: Logger) {}

  /**
   * Runs all pending migrations on the active database connection.
   */
  public async runMigrations(prisma: PrismaClient): Promise<void> {
    const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
    if (nodeEnv === 'production') {
      this.logger.warn('[MigrationRunner] Guard blocked execution: Automatically running database migrations is disabled in production.');
      return;
    }

    this.logger.info('[MigrationRunner] Scanning database connection for pending schema updates...');

    try {
      const pending = await this.getPendingMigrations(prisma);
      if (pending.length === 0) {
        this.logger.info('[MigrationRunner] Schema is up to date. Zero pending migrations.');
        return;
      }

      this.logger.info(`[MigrationRunner] Found ${pending.length} pending migrations. Deploying now: ${JSON.stringify(pending)}`);
      
      // Programmatically deploy via child process exec
      await new Promise<void>((resolve, reject) => {
        exec('npx prisma migrate deploy', { cwd: process.cwd() }, (error, stdout, stderr) => {
          if (error) {
            this.logger.error(`[MigrationRunner] Execution error: ${stderr || error.message}`);
            reject(
              new InternalError(
                `Prisma schema migration execution failed: ${stdout || error.message}. Guidance: Review migrations/ directory contents or execute rollback migrations manually.`,
                { originalError: error }
              )
            );
            return;
          }
          this.logger.info('[MigrationRunner] Deployment completed successfully.');
          resolve();
        });
      });
    } catch (err: any) {
      throw new InternalError(`Migration dispatch cycle failed: ${err.message}`, { originalError: err });
    }
  }

  /**
   * Discovers migrations from directory and compares with applied database records.
   */
  public async getPendingMigrations(prisma: PrismaClient): Promise<string[]> {
    const status = await this.getMigrationStatus(prisma);
    return status.pending;
  }

  /**
   * Computes complete list of applied and pending migrations.
   */
  public async getMigrationStatus(prisma: PrismaClient): Promise<MigrationStatus> {
    const migrationsDir = path.resolve(process.cwd(), 'prisma/migrations');
    
    // Read local folders
    let localMigrations: string[] = [];
    if (fs.existsSync(migrationsDir)) {
      localMigrations = fs
        .readdirSync(migrationsDir)
        .filter((file) => {
          const fullPath = path.join(migrationsDir, file);
          return fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'migration.sql'));
        })
        .sort();
    }

    // Query database applied migrations
    let appliedMigrations: string[] = [];
    try {
      const records: any[] = await prisma.$queryRawUnsafe(
        'SELECT migration_name FROM _prisma_migrations WHERE rolled_back_at IS NULL'
      );
      appliedMigrations = records.map((r) => r.migration_name).sort();
    } catch {
      // Table doesn't exist yet, so all local migrations are pending
    }

    const appliedSet = new Set(appliedMigrations);
    const pending = localMigrations.filter((m) => !appliedSet.has(m));

    return {
      appliedCount: appliedMigrations.length,
      pendingCount: pending.length,
      applied: appliedMigrations,
      pending,
    };
  }
}
