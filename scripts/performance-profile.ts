import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

/**
 * Performance Profiler CLI Tool
 * Measures read/write latencies on database and cache servers.
 *
 * Usage:
 * ```bash
 * ts-node scripts/performance-profile.ts
 * ```
 */
async function runProfiler(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║           QueueForge Pipeline Profiler           ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const prisma = new PrismaClient();
  const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

  try {
    // 1. Measure database execution
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbDuration = Date.now() - dbStart;
    console.log(`  - Database ping latency: ${dbDuration}ms`);

    // 2. Measure cache writes
    const cacheWriteStart = Date.now();
    await redis.set('perf-profile-test-key', 'value', 'EX', 10);
    const cacheWriteDuration = Date.now() - cacheWriteStart;
    console.log(`  - Redis write latency   : ${cacheWriteDuration}ms`);

    // 3. Measure cache reads
    const cacheReadStart = Date.now();
    await redis.get('perf-profile-test-key');
    const cacheReadDuration = Date.now() - cacheReadStart;
    console.log(`  - Redis read latency    : ${cacheReadDuration}ms`);

    console.log('\nAudit complete.');
  } catch (err: any) {
    console.error(`[Profiler] Performance profile audit failed: ${err.message}`);
  } finally {
    await prisma.$disconnect();
    redis.disconnect();
  }
}

if (require.main === module) {
  runProfiler().then(() => process.exit(0));
}

export { runProfiler };
