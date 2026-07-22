import { Server } from 'http';
import { Logger } from '../observability/logging/logger';
import { DependencyContainer } from './types';

/**
 * Coordinates graceful shutdown of the HTTP server, workers, daemons, and storage connections within a specified timeout.
 *
 * @param container - The initialized DependencyContainer context.
 * @param server - The active listening HTTP Server instance.
 * @param logger - The application logger.
 * @param timeoutMs - Maximum duration in milliseconds to wait before forcing termination.
 */
export async function gracefulShutdown(
  container: DependencyContainer,
  server: Server,
  logger: Logger,
  timeoutMs = 10000
): Promise<void> {
  logger.info('[Shutdown] Initiating graceful termination sequence...');

  // Set safety timeout to force exit if graceful cleanup hangs
  const forceExitTimeout = setTimeout(() => {
    logger.error(`[Shutdown] Graceful shutdown timed out after ${timeoutMs}ms! Forcing immediate process exit.`);
    process.exit(1);
  }, timeoutMs);

  let success = false;

  try {
    // 1. Stop accepting new HTTP requests
    logger.info('[Shutdown] Closing HTTP server listener sockets...');
    await new Promise<void>((resolve, reject) => {
      server.close(err => {
        if (err) {
          logger.error('[Shutdown] Error while closing HTTP server socket listener', err);
          return reject(err);
        }
        logger.info('[Shutdown] HTTP server stopped accepting connections.');
        resolve();
      });
    });

    // 2. Shut down container dependencies (Worker, Daemon, Redis, DB, Tracer)
    await container.shutdown();

    success = true;
  } catch (err: any) {
    logger.error('[Shutdown] Graceful cleanup encountered errors!', err);
  }

  clearTimeout(forceExitTimeout);

  if (success) {
    logger.info('[Shutdown] Application cleanly terminated. Goodbye.');
    process.exit(0);
  } else {
    process.exit(1);
  }
}
export { DependencyContainer };
