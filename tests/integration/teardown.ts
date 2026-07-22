import { cleanupTestDatabase } from './test-database-setup';
import { cleanupTestRedis } from './test-redis-setup';
import { cleanupTestQueue } from './test-queue-setup';

/**
 * Shared teardown helper closing all active system handles.
 */
export async function teardownIntegrationTestStack() {
  await cleanupTestQueue();
  await cleanupTestRedis();
  await cleanupTestDatabase();
}
