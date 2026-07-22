import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import * as http from 'http';

/**
 * Self-contained health check runner executing connection checks against
 * Database, Redis, and internal Express routes.
 *
 * Exits with code 0 if all subsystems report success, or code 1 on failure.
 *
 * @example
 * ```bash
 * ts-node scripts/container-health-check.ts
 * ```
 */
async function runHealthCheck(): Promise<void> {
  console.log('[HealthCheck] Starting subsystem status audit...');
  let databaseHealthy = false;
  let redisHealthy = false;
  let apiHealthy = false;

  // 1. Audit Database status
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('[HealthCheck] Database check: OK ✓');
    databaseHealthy = true;
  } catch (err: any) {
    console.error(`[HealthCheck] Database check: FAILED ✗ - ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }

  // 2. Audit Redis broker status
  if (process.env.REDIS_URL) {
    const redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 0,
      connectTimeout: 2000,
    });
    try {
      const pong = await redis.ping();
      if (pong === 'PONG') {
        console.log('[HealthCheck] Redis check: OK ✓');
        redisHealthy = true;
      } else {
        console.error(`[HealthCheck] Redis check: FAILED ✗ - unexpected ping response: "${pong}"`);
      }
    } catch (err: any) {
      console.error(`[HealthCheck] Redis check: FAILED ✗ - ${err.message}`);
    } finally {
      redis.disconnect();
    }
  } else {
    console.log('[HealthCheck] Redis check: SKIPPED (REDIS_URL is not configured)');
    redisHealthy = true; // default to true if skipped
  }

  // 3. Audit Local HTTP endpoint
  const port = process.env.PORT || '3000';
  apiHealthy = await new Promise<boolean>((resolve) => {
    const req = http.get(`http://localhost:${port}/health`, { timeout: 2000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200 && data.includes('"status"')) {
          console.log('[HealthCheck] API endpoint check: OK ✓');
          resolve(true);
        } else {
          console.error(
            `[HealthCheck] API endpoint check: FAILED ✗ - HTTP ${res.statusCode}: ${data}`
          );
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error(`[HealthCheck] API endpoint check: FAILED ✗ - ${err.message}`);
      resolve(false);
    });

    req.end();
  });

  // 4. Summarize results
  if (databaseHealthy && redisHealthy && apiHealthy) {
    console.log('[HealthCheck] Subsystems healthy. Audit passed.');
    process.exit(0);
  } else {
    console.error('[HealthCheck] Subsystems audit FAILED.');
    process.exit(1);
  }
}

runHealthCheck().catch((err) => {
  console.error('[HealthCheck] Unhandled exception occurred during healthcheck:', err);
  process.exit(1);
});
