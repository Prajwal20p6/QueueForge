import * as http from 'http';
import express from 'express';
import { AppConfig } from '../config/app';
import { Logger } from '../observability/logging/logger';

/**
 * Creates and starts the HTTP server listening on the configured host and port.
 */
export async function startServer(
  app: express.Application,
  config: AppConfig,
  logger: Logger
): Promise<http.Server> {
  const server = http.createServer(app);

  const port = config.port || 3000;
  const host = config.hostname || '0.0.0.0';

  return new Promise((resolve, reject) => {
    server.on('error', (err: any) => {
      logger.error(`[Server] Failed to start HTTP server on ${host}:${port}`, err);
      reject(err);
    });

    server.listen(port, host, () => {
      logger.info(`[Server] QueueForge REST API listening on http://${host}:${port}`);
      resolve(server);
    });
  });
}
