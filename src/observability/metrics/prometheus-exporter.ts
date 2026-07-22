import client from 'prom-client';
import { MetricExporter } from './metric-exporter';

/**
 * Exporter outputting OpenMetrics / Prometheus text telemetry format.
 */
export class PrometheusExporter implements MetricExporter {
  constructor(
    public readonly port: number = 9090,
    public readonly path: string = '/metrics'
  ) {}

  /**
   * Formats registered metrics into OpenMetrics Prometheus text format string.
   */
  public async format(metrics?: Map<string, any>): Promise<string> {
    if (metrics) {
      // Refresh registry format
    }
    return client.register.metrics();
  }

  /**
   * Exports metrics formatted for Prometheus scrapers.
   */
  public async export(metrics: Map<string, any>): Promise<string> {
    return this.format(metrics);
  }
}
