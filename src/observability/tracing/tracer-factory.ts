import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { Resource } from '@opentelemetry/resources';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { setupInstrumentations } from './instrumentation';

/**
 * Factory constructing OpenTelemetry NodeTracerProvider with batch span processors and OTLP/Console exporters.
 */
export class TracerFactory {
  /**
   * Constructs and configures an OpenTelemetry NodeTracerProvider instance.
   */
  public static createTracer(config?: any): NodeTracerProvider {
    const serviceName = config?.serviceName || config?.app?.name || 'queueforge';
    const version = config?.version || config?.app?.version || '1.0.0';
    const environment = config?.environment || config?.env || process.env.NODE_ENV || 'development';
    const instanceId = config?.instanceId || `instance-${process.pid}`;

    const resource = new Resource({
      'service.name': serviceName,
      'service.version': version,
      'deployment.environment': environment,
      'service.instance.id': instanceId,
    });

    const provider = new NodeTracerProvider({ resource });

    // Setup exporters based on configuration
    const collectorUrl = config?.tracing?.collectorUrl || process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    if (collectorUrl) {
      const otlpExporter = new OTLPTraceExporter({ url: collectorUrl });
      provider.addSpanProcessor(new BatchSpanProcessor(otlpExporter));
    } else {
      const consoleExporter = new ConsoleSpanExporter();
      provider.addSpanProcessor(new BatchSpanProcessor(consoleExporter));
    }

    provider.register();
    setupInstrumentations(provider);

    return provider;
  }
}
