import { Span as OtelSpan } from '@opentelemetry/api';
import { Logger } from './logging/logger';
import { Tracer } from './tracing/tracer';
import { MetricsRegistry } from './metrics/metrics-registry';
import { AuditLogger } from './audit/audit-logger';

/**
 * Span wrapper interface matching OpenTelemetry Span
 */
export interface Span extends OtelSpan {
  addAttribute(key: string, value: any): this;
  addEvent(name: string, attributes?: Record<string, any>): this;
  recordException(error: Error): this;
  end(): void;
}

/**
 * Combined Context grouping all observability tools
 */
export interface ObservabilityContext {
  logger: Logger;
  tracer: Tracer | any;
  metrics: MetricsRegistry;
  audit: AuditLogger;
  metricsRegistry?: MetricsRegistry;
  auditLogger?: AuditLogger;
  traceContext?: any;
  logContext?: any;
}

/**
 * Immutable business audit event schema
 */
export interface AuditEvent {
  eventType: string;
  entityType: string;
  entityId: string | null;
  action: string;
  changes: any;
  timestamp?: Date;
  actorId?: string;
  tenantId?: string;
  reason?: string;
}

export interface AuditContext {
  actorId?: string;
  tenantId?: string;
  reason?: string;
}
