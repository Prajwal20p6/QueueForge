import Redis from 'ioredis';

/**
 * Benchmark Redis connections.
 */
export async function runRedisBenchmark(): Promise<void> {
  const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  console.log('Redis Benchmark: Querying cache ping speed...');

  try {
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      await redis.ping();
    }
    const duration = Date.now() - start;
    console.log(`  - 100 cache pings processed: ${duration}ms (Avg: ${(duration / 100).toFixed(1)}ms/ping)\n`);
  } catch (err: any) {
    console.warn(`[Redis-Benchmark] Unreached Redis target: ${err.message}`);
  } finally {
    redis.disconnect();
  }
}
