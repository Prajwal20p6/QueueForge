import express from 'express';
import http from 'http';
import { Config } from '../config';
import { DependencyContainer } from './dependencies';
import { setupLogger } from './logger-setup';
import { logStartupSummary } from './startup-summary';
import { StartupValidator } from './startup-validation';
import { waitForHealthy } from './health-check-startup';

/**
 * Boots the application container dependencies, validates configuration rules, and instantiates Express and HTTP servers.
 *
 * @param config - The application unified configuration object.
 * @returns Object holding initialized DependencyContainer, Express Application, and HTTP Server instances.
 */
export async function initializeApplication(config: Config): Promise<{
  container: DependencyContainer;
  app: express.Application;
  server: http.Server;
}> {
  const startTime = new Date();
  
  // Step 1: Setup logger
  const logger = setupLogger(config);
  logger.info('[Initialization] Initiating application bootstrap layers...');

  try {
    // Step 2: Create dependency container
    const container = new DependencyContainer(config, logger);

    // Step 3: Initialize all dependencies (Database, Redis, Queues, Security, Resilience, Workers, Daemons, API)
    await container.initialize();

    // Step 4: Validate startup diagnostic parameters
    const validator = new StartupValidator(config, container, logger);
    await validator.validate();

    // Step 5: Extract Express app and create HTTP server
    const app = container.getApi();
    if (!app) {
      throw new Error('Express API App instance was not successfully registered in container.');
    }

    const server = http.createServer(app);
    container.setServer(server);

    // Step 6: Poll healthy status checks
    await waitForHealthy(container, 15000, 500);

    // Step 7: Log startup banner summary
    logStartupSummary(config, logger, startTime);

    return {
      container,
      app,
      server,
    };
  } catch (err: any) {
    logger.error('[Initialization] Application bootstrap crashed!', err);
    throw err;
  }
}
export { DependencyContainer };
