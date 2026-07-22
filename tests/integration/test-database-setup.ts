import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as path from 'path';

let _prisma: PrismaClient | null = null;

/**
 * Initializes a PrismaClient for integration tests.
 * Runs migrations to bring the test database schema up to date.
 * Falls back to DATABASE_URL from the environment.
 *
 * @returns Initialized PrismaClient ready for test use.
 *
 * @example
 * ```typescript
 * const prisma = await setupTestDatabase();
 * // use prisma in tests...
 * await cleanupTestDatabase();
 * ```
 */
export async function setupTestDatabase(): Promise<PrismaClient> {
  if (_prisma) return _prisma;

  const dbUrl =
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/queueforge_test?schema=public';

  process.env.DATABASE_URL = dbUrl;

  // Run migrations on the test database
  try {
    execSync('npx prisma migrate deploy --skip-generate', {
      env: { ...process.env, DATABASE_URL: dbUrl },
      cwd: path.resolve(__dirname, '../../'),
      stdio: 'pipe',
    });
  } catch (err: any) {
    console.warn('[setupTestDatabase] Migration warning (may already be applied):', err.stderr?.toString());
  }

  _prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
    log: process.env.PRISMA_LOG === 'true' ? ['query', 'info', 'warn', 'error'] : [],
  });

  await _prisma.$connect();
  console.log('[setupTestDatabase] Connected to test database.');
  return _prisma;
}

/**
 * Disconnects the shared test Prisma client and clears the singleton.
 */
export async function cleanupTestDatabase(): Promise<void> {
  if (_prisma) {
    await _prisma.$disconnect();
    _prisma = null;
    console.log('[cleanupTestDatabase] Test database connection closed.');
  }
}

/**
 * Returns the active test Prisma client without re-initializing.
 * @throws {Error} if setupTestDatabase() has not been called.
 */
export function getTestPrisma(): PrismaClient {
  if (!_prisma) {
    throw new Error('[getTestPrisma] setupTestDatabase() must be called before accessing the client.');
  }
  return _prisma;
}
