/**
 * Abstraction interface for exporting registered metrics to external monitoring backends.
 */
export interface MetricExporter {
  export(metrics: Map<string, any>): Promise<any>;
}
