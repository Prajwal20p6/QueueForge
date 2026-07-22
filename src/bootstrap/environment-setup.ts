import dotenv from 'dotenv';
import path from 'path';

/**
 * Bootstraps environment variables, sets the process title, and configures process-level exception handlers.
 */
export async function setupEnvironment(): Promise<void> {
  // 1. Set process title
  process.title = 'queueforge';

  // 2. Load .env file
  const envPath = path.resolve(process.cwd(), '.env');
  dotenv.config({ path: envPath });

  // 3. Validate presence of critical environment variables
  const requiredEnv = ['DATABASE_URL', 'REDIS_HOST', 'JWT_SECRET'];
  const missing = requiredEnv.filter(env => !process.env[env]);

  if (missing.length > 0) {
    console.warn(`[Environment] Warning: Missing required variables: ${missing.join(', ')}`);
  }

  // 4. Register process uncaught exception and promise rejection hooks
  process.on('uncaughtException', (err: Error) => {
    console.error('[Process] CRITICAL: Uncaught Exception thrown!', err);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('[Process] CRITICAL: Unhandled Promise Rejection detected at:', promise, 'reason:', reason);
  });

  // 5. Register process signal warning traps (index.ts overrides these to bind graceful shutdowns)
  process.on('SIGHUP', () => {
    console.log('[Process] Received SIGHUP signal. Reloading configuration settings...');
  });
}
