import { PrismaClient } from '@prisma/client';

/**
 * Benchmark database CRUD execution.
 */
export async function runDatabaseBenchmark(): Promise<void> {
  const prisma = new PrismaClient();
  console.log('Database Benchmark: Querying database connection speed...');

  try {
    const start = Date.now();
    for (let i = 0; i < 10; i++) {
      await prisma.$queryRaw`SELECT 1`;
    }
    const duration = Date.now() - start;
    console.log(`  - 10 pings processed: ${duration}ms (Avg: ${(duration / 10).toFixed(1)}ms/ping)\n`);
  } catch (err: any) {
    console.warn(`[DB-Benchmark] Unreached database target: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}
