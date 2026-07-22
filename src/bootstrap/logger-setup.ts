import { Config } from '../config';
import { Logger } from '../observability/logging/logger';

/**
 * Initializes and configures the production-grade logger instance based on configuration parameters.
 *
 * @param config - The application unified configuration object.
 * @returns An initialized Logger wrapper instance.
 */
export function setupLogger(config: Config): Logger {
  const serviceName = config.app?.name || 'QueueForge';
  // Logger expects ObservabilityConfig as its first parameter and service name as the second parameter.
  const logger = new Logger(config.observability, serviceName);
  logger.info(`[Logger] Logger system initialized for service: ${serviceName}`);
  return logger;
}
