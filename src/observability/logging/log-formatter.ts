import { LogContext } from './log-context';

/**
 * Formatter formatting JSON log entries and sanitizing sensitive secrets/credentials.
 */
export class LogFormatter {
  /**
   * Sanitizes object data masking sensitive password, token, and secret fields.
   */
  public static sanitizeData(data: Record<string, any>): Record<string, any> {
    if (!data || typeof data !== 'object') return data;

    const sensitiveKeys = ['password', 'secret', 'token', 'authorization', 'apiKey', 'api_key', 'privateKey'];
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSecret = sensitiveKeys.some(s => lowerKey.includes(s.toLowerCase()));

      if (isSecret && typeof value === 'string') {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = LogFormatter.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Formats a structured log record.
   */
  public static formatLog(
    level: string,
    message: string,
    context: LogContext | Record<string, any>,
    data?: Record<string, any>
  ): Record<string, any> {
    const ctxData = context instanceof LogContext ? context.toJSON() : context;
    const sanitizedData = LogFormatter.sanitizeData(data || {});

    return {
      timestamp: new Date().toISOString(),
      level: level.toLowerCase(),
      message,
      context: ctxData,
      data: sanitizedData,
    };
  }

  /**
   * Formats an error entry including stack trace and error message.
   */
  public static formatError(error: Error, context: LogContext | Record<string, any>): Record<string, any> {
    const ctxData = context instanceof LogContext ? context.toJSON() : context;

    return {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: ctxData,
    };
  }
}
