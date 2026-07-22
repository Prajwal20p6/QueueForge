import { Meter, Counter as OtelCounter } from '@opentelemetry/api';

/**
 * Metric wrapper for OpenTelemetry Counter tracking cumulative monotonically increasing metrics.
 */
export class Counter {
  private readonly counter?: OtelCounter;

  constructor(
    meter: Meter | any,
    public readonly name: string,
    public readonly unit: string = '1',
    public readonly description: string = ''
  ) {
    if (meter && typeof meter.createCounter === 'function') {
      this.counter = meter.createCounter(name, { unit, description });
    }
  }

  /**
   * Adds specified value to the counter.
   */
  public add(value: number, attributes?: Record<string, any>): void {
    if (this.counter) {
      this.counter.add(value, attributes);
    }
  }

  /**
   * Increments the counter by 1.
   */
  public increment(attributes?: Record<string, any>): void {
    this.add(1, attributes);
  }
}
