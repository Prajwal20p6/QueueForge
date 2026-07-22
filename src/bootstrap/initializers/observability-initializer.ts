import { Container } from '../container';
import { initializeObservabilityModule } from '../../observability';

/**
 * Initializer bootstrapping OpenTelemetry tracing, Pino structured logging, Prometheus metrics, and Audit logger.
 */
export class ObservabilityInitializer {
  constructor(private readonly container: Container) {}

  public async initialize(): Promise<void> {
    const config = this.container.has('config') ? this.container.get('config') : undefined;
    const observabilityContext = await initializeObservabilityModule(config);

    this.container.register('observability', () => observabilityContext);
    this.container.register('tracer', () => observabilityContext.tracer);
    this.container.register('logger', () => observabilityContext.logger);
    this.container.register('metrics', () => observabilityContext.metricsRegistry || observabilityContext.metrics);
    this.container.register('auditLogger', () => observabilityContext.auditLogger || observabilityContext.audit);
  }
}
