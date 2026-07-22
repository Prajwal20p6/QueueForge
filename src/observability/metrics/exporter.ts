import { MetricsRegistry } from './metrics-registry';
import { Logger } from '../logging/logger';

/**
 * Exporter formatting and serializing registered metrics into Prometheus or JSON payloads.
 */
export class MetricsExporter {
  private readonly registry: MetricsRegistry;
  private readonly logger: Logger;

  constructor(registry: MetricsRegistry, logger: Logger) {
    this.registry = registry;
    this.logger = logger;
  }

  private lastMetricsString = '';

  /**
   * Prom-client serialization outputting Prometheus metric text formatted with TYPE and HELP annotations.
   */
  public async export(): Promise<string> {
    try {
      this.logger.debug('Exporting Prometheus scraping endpoint payload');
      const res = await this.registry.export();
      this.lastMetricsString = res;
      return res;
    } catch (err: any) {
      this.logger.error('Failed to export Prometheus metrics payload', err);
      throw err;
    }
  }

  public exportJSON(): any {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.lastMetricsString,
    };
  }

  /**
   * Synchronously exports current metrics registry string.
   */
  public exportPrometheus(): string {
    return this.lastMetricsString;
  }
}
