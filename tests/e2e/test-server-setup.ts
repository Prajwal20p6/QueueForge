import express from 'express';
import * as http from 'http';
import { DependencyContainer } from '../../src/bootstrap/dependencies';
import { Config } from '../../src/config';
import { loadConfig } from '../../src/config';

/** Result returned by setupTestServer for E2E test use. */
export interface TestServerContext {
  app: express.Application;
  server: http.Server;
  dependencies: DependencyContainer;
  baseUrl: string;
}

let _context: TestServerContext | null = null;

/**
 * Bootstraps a full Express application for E2E tests using mocked infrastructure.
 * Sets process.env.NODE_ENV to 'test' and uses the .env.test configuration.
 *
 * @param configOverrides - Optional partial Config overrides for the test instance.
 * @returns TestServerContext with app, server, dependencies, and baseUrl.
 *
 * @example
 * ```typescript
 * const ctx = await setupTestServer();
 * const res = await fetch(`${ctx.baseUrl}/api/v1/health`);
 * await teardownTestServer();
 * ```
 */
export async function setupTestServer(
  configOverrides?: Partial<Config>
): Promise<TestServerContext> {
  if (_context) return _context;

  process.env.NODE_ENV = 'test';
  process.env.START_WORKER = 'false';
  process.env.START_DAEMON = 'false';

  const config = { ...(await loadConfig()), ...configOverrides } as Config;
  const port = (config.app as { port?: number }).port ?? 3001;

  // Build logger from config
  const { Logger } = await import('../../src/observability/logging/logger');
  const logger = new Logger(config.observability, config.app?.name ?? 'QueueForge');

  // Initialize dependency container
  const container = new DependencyContainer(config, logger);
  await container.initialize();

  const app = container.getApi();
  if (!app) {
    throw new Error('[setupTestServer] Express application is null after initialization.');
  }

  const server = await new Promise<http.Server>((resolve, reject) => {
    const s = app.listen(port, () => resolve(s));
    s.once('error', reject);
  });

  const baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}`;

  _context = { app, server, dependencies: container, baseUrl };
  console.log(`[setupTestServer] E2E test server running at ${baseUrl}`);
  return _context;
}

/**
 * Shuts down the test server and cleans up the dependency container.
 */
export async function teardownTestServer(): Promise<void> {
  if (!_context) return;

  const { server, dependencies } = _context;

  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });

  await dependencies.shutdown();
  _context = null;
  console.log('[teardownTestServer] E2E test server stopped.');
}

/**
 * Returns the active test server context without re-initializing.
 * @throws {Error} if setupTestServer() has not been called.
 */
export function getTestServerContext(): TestServerContext {
  if (!_context) {
    throw new Error('[getTestServerContext] setupTestServer() must be called first.');
  }
  return _context;
}
