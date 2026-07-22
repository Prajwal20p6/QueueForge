import { Logger } from '../src/observability/logging/logger';

export interface Incident {
  id: string;
  description: string;
  severity: number;
  urgency: number;
  affectedComponents: string[];
}

/**
 * Detector class validating incident conditions.
 */
export class IncidentDetector {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Scans metrics state to diagnose incident alerts.
   */
  public async detect(errorRate: number, latencyMs: number): Promise<Incident | null> {
    if (errorRate > 5.0 || latencyMs > 5000) {
      this.logger.error('[IncidentDetector] Service breach detected!');
      return {
        id: `INC-${Date.now()}`,
        description: 'System Ingestion Latency/Error rate degradation',
        severity: 1,
        urgency: 1,
        affectedComponents: ['API Gateway', 'Ingestion Engine'],
      };
    }
    return null;
  }
}
