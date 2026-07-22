import { PrismaClient } from '@prisma/client';
import { DatabaseConfig } from '../../config/database.config';
import { InternalError } from '../../shared/errors/internal-error';

let prisma: PrismaClient | null = null;

/**
 * Accesses or instantiates global singleton PrismaClient.
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

/**
 * Connects to PostgreSQL using configuration backoff and verifies connectivity.
 */
export async function connectDatabase(config: DatabaseConfig): Promise<void> {
  try {
    const logOptions: any[] = [];
    if (config.enableLogging) {
      logOptions.push('query', 'info', 'warn', 'error');
    } else {
      logOptions.push('error');
    }

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: config.url,
        },
      },
      log: logOptions,
    });

    // Verify connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Attempt to pull metrics if enabled
    let metricsMsg = 'Metrics not supported';
    try {
      const anyPrisma = prisma as any;
      if (anyPrisma.$metrics && typeof anyPrisma.$metrics.json === 'function') {
        const stats = await anyPrisma.$metrics.json();
        metricsMsg = `Active conns: ${stats?.gauges?.find((g: any) => g.key === 'prisma_client_database_connections_active')?.value || 0}`;
      }
    } catch {
      metricsMsg = 'Metrics disabled';
    }

    process.stdout.write(`[Database] Connected successfully. Pool stats: [${metricsMsg}]\n`);
  } catch (err: any) {
    throw new InternalError(`Database initialization failed: ${err.message}`);
  }
}

/**
 * Gracefully disconnects database connection.
 */
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
