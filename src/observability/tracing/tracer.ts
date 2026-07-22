import { trace, context, metrics, Tracer as OtelTracer, Meter } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-node';
import { ObservabilityConfig } from '../../config/observability';
import { Logger } from '../logging/logger';

/**
 * Tracer wrapper around OpenTelemetry NodeSDK managing lifecycles and exporters.
 */
export class Tracer {
  private readonly config: ObservabilityConfig;
  private readonly logger: Logger;
  private sdk: NodeSDK | null = null;
  private serviceName: string;

  constructor(config: ObservabilityConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.serviceName = config.jaegerServiceName || 'queueforge';
  }

  /**
   * Initializes the OpenTelemetry SDK with OTLP HTTP trace exporter.
   */
  public async initialize(): Promise<void> {
    if (!this.config.tracingEnabled) {
      this.logger.info('Tracing is disabled in configuration');
      return;
    }

    try {
      this.logger.info('Initializing OpenTelemetry NodeSDK tracer...');

      const traceExporter = new OTLPTraceExporter({
        url: this.config.jaegerEndpoint || 'http://localhost:4318/v1/traces',
      });

      const sampler = new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(this.config.traceSampleRate ?? 1.0),
      });

      const resource = new Resource({
        'service.name': this.serviceName,
        'service.version': '1.0.0',
        'deployment.environment': process.env.NODE_ENV || 'development',
        'environment': process.env.NODE_ENV || 'development',
      });

      this.sdk = new NodeSDK({
        resource,
        traceExporter,
        sampler,
      });

      await this.sdk.start();
      this.logger.info(`OpenTelemetry NodeSDK tracer initialized for service: ${this.serviceName}`);
    } catch (err: any) {
      this.logger.error('Failed to initialize OpenTelemetry NodeSDK tracer', err);
      throw err;
    }
  }

  /**
   * Shuts down the OpenTelemetry SDK gracefully.
   */
  public async shutdown(): Promise<void> {
    if (!this.sdk) return;

    try {
      this.logger.info('Shutting down OpenTelemetry NodeSDK tracer...');
      await this.sdk.shutdown();
      this.logger.info('OpenTelemetry NodeSDK tracer shut down successfully');
    } catch (err: any) {
      this.logger.error('Error during OpenTelemetry NodeSDK tracer shutdown', err);
    }
  }

  /**
   * Retrieves the OpenTelemetry API Tracer instance.
   */
  public getTracer(): OtelTracer {
    return trace.getTracer(this.serviceName);
  }

  /**
   * Extracts the active trace ID from the current execution context.
   */
  public getTraceId(): string {
    const activeSpan = trace.getSpan(context.active());
    return activeSpan?.spanContext().traceId || '';
  }

  /**
   * Retrieves the OpenTelemetry API Meter instance.
   */
  public getMeter(): Meter {
    return metrics.getMeter(this.serviceName);
  }
}
export { ObservabilityConfig, Logger };
