import { Meter, Histogram as OtelHistogram } from '@opentelemetry/api';

/**
 * Metric wrapper for OpenTelemetry Histogram tracking value distributions and durations.
 */
export class Histogram {
  private readonly histogram?: OtelHistogram;

  constructor(
    meter: Meter | any,
    public readonly name: string,
    public readonly unit: string = 'ms',
    public readonly description: string = ''
  ) {
    if (meter && typeof meter.createHistogram === 'function') {
      this.histogram = meter.createHistogram(name, { unit, description });
    }
  }

  /**
   * Records a value entry in the histogram distribution.
   */
  public record(value: number, attributes?: Record<string, any>): void {
    if (this.histogram) {
      this.histogram.record(value, attributes);
    }
  }

  /**
   * Calculates execution duration from startTime timestamp and records in histogram.
   */
  public recordDuration(startTime: number, attributes?: Record<string, any>): void {
    const duration = Date.now() - startTime;
    this.record(duration, attributes);
  }
}
