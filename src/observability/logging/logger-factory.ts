import pino from 'pino';
import { Logger } from './logger';

/**
 * Factory creating Pino logger instances configured with JSON formatters and stream transports.
 */
export class LoggerFactory {
  /**
   * Constructs a typed Logger instance.
   */
  public static createLogger(config?: any, name: string = 'queueforge'): Logger {
    const level = (config?.logging?.level || config?.level || process.env.LOG_LEVEL || 'info').toLowerCase();

    const pinoLogger = pino({
      name,
      level,
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level(label) {
          return { level: label };
        },
      },
    });

    return new Logger(pinoLogger);
  }
}
