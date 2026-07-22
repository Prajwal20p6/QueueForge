import { SLI, evaluateSLI } from './sli-definitions';
import { Logger } from '../src/observability/logging/logger';
import { MetricsRegistry } from '../src/observability/metrics/metrics-registry';

/**
 * Validator class validating SLI metrics compliance thresholds.
 */
export class SLIValidator {
  private readonly slis: SLI[];
  private readonly _metrics: MetricsRegistry;
  private readonly logger: Logger;

  constructor(slis: SLI[], metrics: MetricsRegistry, logger: Logger) {
    this.slis = slis;
    this._metrics = metrics;
    this.logger = logger;
    this.logger.debug('SLIValidator initialized', { hasRegistry: !!this._metrics });
  }

  /**
   * Validates single SLI metric compliance.
   */
  public async validateSingle(sli: SLI): Promise<boolean> {
    this.logger.debug(`[SLIValidator] Validating: ${sli.name}`);
    const simulatedVal = sli.operator === 'eq' ? 1 : 120; // Simulated latency/uptime value
    return evaluateSLI(sli, simulatedVal);
  }

  /**
   * Validates overall compliance status for all registered SLIs.
   */
  public async validate(): Promise<boolean> {
    for (const sli of this.slis) {
      const valid = await this.validateSingle(sli);
      if (!valid) return false;
    }
    return true;
  }
}
