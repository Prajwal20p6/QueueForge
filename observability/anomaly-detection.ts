import { Logger } from '../src/observability/logging/logger';

export interface Anomaly {
  metric: string;
  zScore: number;
  confidence: number;
  context: string;
}

/**
 * Statistical machine learning class checking metric anomalies.
 */
export class AnomalyDetector {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Compares input metrics against rolling mean parameters to compute z-scores.
   */
  public detect(metric: string, val: number, mean: number, stdDev: number): Anomaly | null {
    if (stdDev <= 0) return null;

    const zScore = Math.abs(val - mean) / stdDev;
    if (zScore > 3.0) {
      this.logger.warn(`[AnomalyDetector] Anomaly spotted on ${metric}! Z-Score: ${zScore.toFixed(2)}`);
      return {
        metric,
        zScore,
        confidence: 99.7,
        context: `Metric value ${val} deviated by more than 3 standard deviations from mean ${mean}`,
      };
    }
    return null;
  }
}
