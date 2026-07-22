import pino from 'pino';
import { trace, context as otelContext } from '@opentelemetry/api';
import { getDevFormatter, getProdFormatter } from './formatters';
import { LogContext } from './log-context';

/**
 * Production-ready Logger wrapper implementing standard levels and telemetry correlations.
 */
export class Logger {
  private readonly pinoLogger: pino.Logger;
  private readonly contextMetadata: Record<string, any>;

  constructor(...args: any[]) {
    if (args[0] && typeof args[0].info === 'function') {
      // Form: (pinoLogger, context?)
      this.pinoLogger = args[0];
      this.contextMetadata = args[1] || {};
    } else {
      // Form: (config, name)
      const config = args[0] || {};
      const name = typeof args[1] === 'string' ? args[1] : 'queueforge';
      const level = config?.logLevel || config?.level || process.env.LOG_LEVEL || 'info';
      const isProd = process.env.NODE_ENV === 'production';
      const pinoOpts = isProd ? getProdFormatter(level) : getDevFormatter(level);

      this.pinoLogger = pino({
        ...pinoOpts,
        base: {
          service: name,
          environment: process.env.NODE_ENV || 'development',
        },
      });
      this.contextMetadata = {};
    }
  }

  private processContext(ctx?: any): Record<string, any> {
    const correlation = this.getCorrelationContext();
    const merged = { ...correlation, ...this.contextMetadata };

    if (!ctx) return merged;

    if (ctx instanceof LogContext) {
      return { ...merged, ...ctx.toJSON() };
    }

    if (typeof ctx === 'object') {
      const { err, error, ...rest } = ctx;
      const targetError = err || error;
      const errorPayload = targetError ? { err: { message: targetError.message, stack: targetError.stack, ...targetError } } : {};
      return { ...merged, ...rest, ...errorPayload };
    }

    return { ...merged, customContext: ctx };
  }

  private getCorrelationContext(): Record<string, any> {
    const activeSpan = trace.getSpan(otelContext.active());
    if (activeSpan) {
      const spanContext = activeSpan.spanContext();
      return {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
      };
    }
    return {};
  }

  public debug(message: string, data?: Record<string, any>): void {
    this.pinoLogger.debug(this.processContext(data), message);
  }

  public info(message: string, data?: Record<string, any>): void {
    this.pinoLogger.info(this.processContext(data), message);
  }

  public warn(message: string, data?: Record<string, any>): void {
    this.pinoLogger.warn(this.processContext(data), message);
  }

  public error(message: string, error?: Error | any, data?: Record<string, any>): void {
    const errObj = error instanceof Error ? error : (error ? new Error(String(error)) : undefined);
    const combinedData = { ...(errObj ? { err: errObj } : {}), ...data };
    this.pinoLogger.error(this.processContext(combinedData), message);
  }

  public trace(message: string, data?: Record<string, any>): void {
    this.pinoLogger.trace(this.processContext(data), message);
  }

  public withContext(context: Record<string, any>): Logger {
    const newContext = { ...this.contextMetadata, ...context };
    return new Logger(this.pinoLogger, newContext);
  }
}
