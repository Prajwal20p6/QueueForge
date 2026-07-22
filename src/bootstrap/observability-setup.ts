import { Config } from '../config';
import { Logger } from '../observability/logging/logger';
import { ObservabilityContext, initializeObservability } from '../observability';

/**
 * Configures OpenTelemetry tracing SDKs, Prometheus metrics, and Audit logging registries.
 *
 * @param config - The application unified configuration object.
 * @param logger - The application logger.
 * @returns Configured ObservabilityContext containing logger, tracer, metrics, and audit logger.
 */
export async function setupObservability(
  config: Config,
  logger: Logger
): Promise<ObservabilityContext> {
  logger.info('[ObservabilitySetup] Starting OpenTelemetry tracing and Prometheus metrics exporter...');

  try {
    const context = await initializeObservability(config.observability);
    logger.info('[ObservabilitySetup] Observability subsystem telemetry hooks successfully mounted.');
    return context;
  } catch (err: any) {
    logger.error('[ObservabilitySetup] Failed to initialize observability telemetry layers', err);
    throw err;
  }
}
