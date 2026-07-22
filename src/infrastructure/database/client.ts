import { PrismaClient, Prisma } from '@prisma/client';
import { getConfig } from '../../config';
import { calculateBackoff } from '../../shared/utils/time';
import { InfrastructureError } from '../../shared/errors/infrastructure-error';
import { ErrorCode } from '../../shared/constants/error-codes';

let prismaInstance: PrismaClient | null = null;

/**
 * Accesses the lazy-loaded PrismaClient instance configured via app config settings.
 */
export function getPrismaClient(): PrismaClient {
  if (prismaInstance) {
    return prismaInstance;
  }

  const config = getConfig();
  prismaInstance = new PrismaClient({
    datasources: {
      db: {
        url: config.database.url,
      },
    },
    log: config.database.enableLogging ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

  return prismaInstance;
}

/**
 * Asserts PostgreSQL database connection state and returns connectivity latency
 */
export async function getConnectionStatus(): Promise<{ isConnected: boolean; latencyMs: number }> {
  const client = getPrismaClient();
  const start = Date.now();
  try {
    await client.$queryRaw`SELECT 1`;
    return { isConnected: true, latencyMs: Date.now() - start };
  } catch {
    return { isConnected: false, latencyMs: -1 };
  }
}

/**
 * Initializes PostgreSQL database client, testing connectivity with backoff retries.
 */
export async function initializeDatabase(): Promise<PrismaClient> {
  const client = getPrismaClient();
  const config = getConfig();

  let attempt = 0;
  const maxAttempts = config.database?.retryAttempts ?? 3;
  const baseDelay = config.database?.retryDelay ?? 1000;

  process.stdout.write('[Database] Initializing connection client...\n');

  while (attempt < maxAttempts) {
    try {
      await client.$queryRaw`SELECT 1`;
      process.stdout.write(
        `[Database] Connection established successfully (Attempt ${attempt + 1}/${maxAttempts})\n`
      );
      return client;
    } catch (err: any) {
      attempt++;
      process.stderr.write(
        `[Database] Connection failed (Attempt ${attempt}/${maxAttempts}): ${err.message}\n`
      );

      if (attempt >= maxAttempts) {
        throw new InfrastructureError(
          `Database initialization failed after ${maxAttempts} attempts: ${err.message}`,
          ErrorCode.DB_CONNECTION_FAILED,
          { originalError: err }
        );
      }

      const backoffDelay = calculateBackoff(attempt - 1, baseDelay, 15000);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }

  throw new InfrastructureError('Database initialization failed', ErrorCode.DB_CONNECTION_FAILED);
}

/**
 * Cleanly disconnects the Prisma client database instance
 */
export async function disconnectDatabase(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
    process.stdout.write('[Database] Disconnected successfully.\n');
  }
}

/**
 * Runs a block of database queries in a transaction context
 */
export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  const client = getPrismaClient();
  try {
    return await client.$transaction(callback);
  } catch (err: any) {
    if (err instanceof InfrastructureError) {
      throw err;
    }
    throw new InfrastructureError(
      `Transaction execution failed: ${err.message}`,
      ErrorCode.DB_CONNECTION_FAILED,
      { originalError: err }
    );
  }
}
