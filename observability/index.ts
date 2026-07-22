import { SLOTracker } from './slo-tracker';
import { SLIValidator } from './sli-validator';
import { IncidentDetector } from './incident-detection';
import { AnomalyDetector } from './anomaly-detection';
import { AlertOrchestrator } from './alert-orchestration';
import { EnhancedTracer } from './tracing-enhanced';
import { EnhancedMetricsRegistry } from './metrics-enhanced';
import { Logger } from '../src/observability/logging/logger';
import { MetricsRegistry } from '../src/observability/metrics/metrics-registry';
import { Tracer } from '../src/observability/tracing/tracer';

export {
  SLOTracker,
  SLIValidator,
  IncidentDetector,
  AnomalyDetector,
  AlertOrchestrator,
  EnhancedTracer,
  EnhancedMetricsRegistry,
};

export interface AdvancedObservabilityContext {
  sloTracker: SLOTracker;
  sliValidator: SLIValidator;
  incidentDetector: IncidentDetector;
  anomalyDetector: AnomalyDetector;
  alertOrchestrator: AlertOrchestrator;
  tracer: EnhancedTracer;
  metrics: EnhancedMetricsRegistry;
}

/**
 * Initializes and wires all advanced SLO/SLI observability layers.
 */
export function initializeAdvancedObservability(
  baseTracer: Tracer,
  baseMetrics: MetricsRegistry,
  logger: Logger
): AdvancedObservabilityContext {
  const sloTracker = new SLOTracker([], baseMetrics, logger);
  const sliValidator = new SLIValidator([], baseMetrics, logger);
  const incidentDetector = new IncidentDetector(logger);
  const anomalyDetector = new AnomalyDetector(logger);
  const alertOrchestrator = new AlertOrchestrator(sloTracker, logger);
  const tracer = new EnhancedTracer(baseTracer);
  const metrics = new EnhancedMetricsRegistry(baseMetrics);

  return {
    sloTracker,
    sliValidator,
    incidentDetector,
    anomalyDetector,
    alertOrchestrator,
    tracer,
    metrics,
  };
}
