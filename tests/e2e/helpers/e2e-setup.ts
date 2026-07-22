/**
 * @fileoverview E2E Setup Helper
 *
 * Provides bootstrapping and teardown utilities for E2E test scenarios,
 * wrapping the test server lifecycle and providing clean state per suite.
 */
import { setupTestServer, teardownTestServer, TestServerContext } from '../../e2e/test-server-setup';
import { TestClient } from '../../e2e/test-client';

let serverContext: TestServerContext | null = null;

/**
 * Initializes the full QueueForge E2E test server.
 * Idempotent — subsequent calls return the existing context.
 */
export async function initE2E(): Promise<{ context: TestServerContext; client: TestClient }> {
  if (!serverContext) {
    serverContext = await setupTestServer();
  }
  const client = new TestClient(serverContext.baseUrl, 'e2e-test-api-key');
  return { context: serverContext, client };
}

/**
 * Tears down the E2E test server and releases resources.
 */
export async function destroyE2E(): Promise<void> {
  await teardownTestServer();
  serverContext = null;
}

/**
 * Creates a scoped TestClient for a given base URL.
 * @param baseUrl - Server base URL.
 * @param apiKey - Optional API key for authentication.
 */
export function createE2EClient(baseUrl: string, apiKey?: string): TestClient {
  return new TestClient(baseUrl, apiKey);
}
