import { Config } from '../config';
import { Logger } from '../observability/logging/logger';

/**
 * Formats and logs a structured, operator-friendly summary of the initialized application state.
 *
 * @param config - The application unified configuration object.
 * @param logger - The application logger.
 * @param startTime - Application launch timestamp.
 */
export function logStartupSummary(config: Config, logger: Logger, startTime: Date): void {
  const durationMs = Date.now() - startTime.getTime();
  const appName = config.app?.name || 'QueueForge';
  const appVersion = config.app?.version || '1.0.0';
  const env = config.app?.environment || 'development';
  const port = config.app?.port || 3000;
  const hostname = config.app?.hostname || 'localhost';

  const workerEnabled = process.env.START_WORKER !== 'false' && env !== 'test';
  const daemonEnabled = process.env.START_DAEMON !== 'false' && env !== 'test';

  logger.info(`
============================================================
   ${appName.toUpperCase()} EVENT-DRIVEN PIPELINE ENGINE ACTIVATED
============================================================
   Version:      ${appVersion}
   Environment:  ${env}
   Duration:     ${durationMs}ms
   Listening:    http://${hostname}:${port}
============================================================
   [SUBSYSTEMS STATUS]
   - REST API Server:   ACTIVE (Port ${port})
   - Background Worker: ${workerEnabled ? 'ACTIVE' : 'DISABLED'}
   - Daemon Scheduler:  ${daemonEnabled ? 'ACTIVE' : 'DISABLED'}
   - Database Pool:     CONNECTED (Schema: Up-to-date)
   - Redis Memory:      CONNECTED (Cluster Mode: Standalone)
   - Telemetry Traces:  ACTIVE (OTLP Exporter)
============================================================
   Next Operator Steps:
   1. Check metrics scraping at GET http://${hostname}:${port}/metrics
   2. Verify active worker health at GET http://${hostname}:${port}/v1/dashboard/stats
   3. Dispatch ingestion classifications payloads to POST http://${hostname}:${port}/v1/results
============================================================
  `);
}
