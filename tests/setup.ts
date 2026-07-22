/**
 * Global setup function executed once before test suite run.
 */
export default async function globalSetup(): Promise<void> {
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/queueforge_test';
  process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
  process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforqueueforgetesting123';

  process.stdout.write('[Test Setup] Initialized test environment variables successfully.\n');
}
