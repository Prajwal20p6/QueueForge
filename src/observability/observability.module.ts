import { ObservabilityContext } from './context/observability-context';
import { TracerFactory } from './tracing/tracer-factory';
import { LoggerFactory } from './logging/logger-factory';
import { MetricsRegistry } from './metrics/metrics-registry';
import { AuditLogger } from './audit/audit-logger';
import { DatabaseAuditStorage } from './audit/audit-storage';
import { HealthScore } from './health/health-score';
import { SLOTracker } from './health/slo-tracker';
import { PrometheusExporter } from './metrics/prometheus-exporter';
import { getPrismaClient } from '../infrastructure/database/client';
import { AuditLogRepository } from '../infrastructure/repositories/audit-log.repository';
import { AuditRepository } from './audit/audit-repository';

let activeObservabilityContext: any = null;

export function setActiveObservabilityContext(ctx: any): void {
  activeObservabilityContext = ctx;
}

/**
 * Initializes and registers the core Observability module and returns ObservabilityContext instance.
 */
export async function initializeObservabilityModule(config?: any): Promise<ObservabilityContext> {
  const tracerProvider = TracerFactory.createTracer(config);
  const tracer = tracerProvider.getTracer('queueforge');

  const logger = LoggerFactory.createLogger(config);
  const metricsRegistry = new MetricsRegistry(config, logger);
  await metricsRegistry.initialize();

  let auditLogger: AuditLogger;
  try {
    const prisma = getPrismaClient();
    const baseRepo = new AuditLogRepository(prisma, logger as any);
    const auditRepo = new AuditRepository(baseRepo);
    auditLogger = new AuditLogger(logger, auditRepo, metricsRegistry);
  } catch {
    const auditStorage = new DatabaseAuditStorage();
    auditLogger = new AuditLogger(auditStorage, logger);
  }

  const healthScore = new HealthScore(metricsRegistry);
  const sloTracker = new SLOTracker(metricsRegistry);
  const exporter = new PrometheusExporter();

  logger.info('Observability initialized successfully');

  activeObservabilityContext = {
    tracer,
    metricsRegistry,
    logger,
    auditLogger,
    metrics: metricsRegistry,
    audit: auditLogger,
  };

  (activeObservabilityContext as any).healthScore = healthScore;
  (activeObservabilityContext as any).sloTracker = sloTracker;
  (activeObservabilityContext as any).exporter = exporter;

  return activeObservabilityContext;
}

/**
 * Backward compatibility alias for initializing observability context.
 */
export async function initializeObservability(config?: any): Promise<ObservabilityContext> {
  return initializeObservabilityModule(config);
}

/**
 * Retrieves global active ObservabilityContext instance.
 */
export function getObservability(): ObservabilityContext {
  if (!activeObservabilityContext) {
    const logger = LoggerFactory.createLogger();
    const metricsRegistry = new MetricsRegistry({}, logger);
    let auditLogger: AuditLogger;
    try {
      const prisma = getPrismaClient();
      const baseRepo = new AuditLogRepository(prisma, logger as any);
      const auditRepo = new AuditRepository(baseRepo);
      auditLogger = new AuditLogger(logger, auditRepo, metricsRegistry);
    } catch {
      auditLogger = new AuditLogger(new DatabaseAuditStorage(), logger);
    }

    activeObservabilityContext = {
      tracer: TracerFactory.createTracer().getTracer('queueforge'),
      metricsRegistry,
      logger,
      auditLogger,
      metrics: metricsRegistry,
      audit: auditLogger,
    };
  }
  return activeObservabilityContext;
}
