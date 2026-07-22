import { Request } from 'express';
import { trace, context as otelContext } from '@opentelemetry/api';

export interface LogContextOptions {
  requestId?: string;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  apiKeyId?: string;
  deliveryId?: string;
  destinationId?: string;
  component?: string;
  tenantId?: string;
  custom?: Record<string, any>;
  contextData?: Record<string, any>;
}

/**
 * LogContext interface and class tracking execution identifiers for logging correlation.
 */
export class LogContext {
  public readonly traceId?: string;
  public readonly spanId?: string;
  public readonly userId?: string;
  public readonly apiKeyId?: string;
  public readonly deliveryId?: string;
  public readonly destinationId?: string;
  public readonly component?: string;
  public readonly tenantId?: string;
  public readonly requestId?: string;
  public readonly correlationId?: string;
  public readonly custom?: Record<string, any>;
  public readonly contextData: Record<string, any>;

  constructor(
    traceIdOrOpts: string | LogContextOptions = '',
    spanId = '',
    userId = '',
    tenantId = '',
    requestId = '',
    contextData: Record<string, any> = {}
  ) {
    if (typeof traceIdOrOpts === 'object') {
      const opts = traceIdOrOpts;
      this.traceId = opts.traceId || '';
      this.spanId = opts.spanId || '';
      this.userId = opts.userId || '';
      this.apiKeyId = opts.apiKeyId || '';
      this.deliveryId = opts.deliveryId || '';
      this.destinationId = opts.destinationId || '';
      this.component = opts.component || '';
      this.tenantId = opts.tenantId || '';
      this.requestId = opts.requestId || '';
      this.correlationId = opts.correlationId || opts.requestId || '';
      this.custom = opts.custom || {};
      this.contextData = opts.contextData || opts.custom || {};
    } else {
      this.traceId = traceIdOrOpts;
      this.spanId = spanId;
      this.userId = userId;
      this.tenantId = tenantId;
      this.requestId = requestId;
      this.correlationId = requestId;
      this.contextData = contextData;
    }
  }

  public with(additionalContext: Record<string, any>): LogContext {
    return new LogContext({
      traceId: this.traceId,
      spanId: this.spanId,
      userId: this.userId,
      tenantId: this.tenantId,
      requestId: this.requestId,
      apiKeyId: this.apiKeyId,
      deliveryId: this.deliveryId,
      destinationId: this.destinationId,
      component: this.component,
      custom: { ...this.custom, ...additionalContext },
      contextData: { ...this.contextData, ...additionalContext },
    });
  }

  public toJSON(): Record<string, any> {
    return {
      ...(this.traceId ? { traceId: this.traceId } : {}),
      ...(this.spanId ? { spanId: this.spanId } : {}),
      ...(this.userId ? { userId: this.userId } : {}),
      ...(this.apiKeyId ? { apiKeyId: this.apiKeyId } : {}),
      ...(this.deliveryId ? { deliveryId: this.deliveryId } : {}),
      ...(this.destinationId ? { destinationId: this.destinationId } : {}),
      ...(this.component ? { component: this.component } : {}),
      ...(this.tenantId ? { tenantId: this.tenantId } : {}),
      ...(this.requestId ? { requestId: this.requestId } : {}),
      ...(this.correlationId ? { correlationId: this.correlationId } : {}),
      ...this.contextData,
      ...this.custom,
    };
  }

  public static fromRequest(req: Request): LogContext {
    const activeSpan = trace.getSpan(otelContext.active());
    const traceId = activeSpan?.spanContext().traceId || (req.headers['x-trace-id'] as string) || '';
    const spanId = activeSpan?.spanContext().spanId || (req.headers['x-span-id'] as string) || '';

    const requestId =
      (req.headers['x-request-id'] as string) ||
      (req as any).correlationId ||
      '';

    const userId = (req as any).credentials?.subject || (req as any).user?.id || '';
    const tenantId = (req.headers['x-tenant-id'] as string) || '';

    return new LogContext({
      traceId,
      spanId,
      userId,
      tenantId,
      requestId,
      correlationId: requestId,
    });
  }
}
