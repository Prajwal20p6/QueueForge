import { Meter, UpDownCounter as OtelUpDownCounter } from '@opentelemetry/api';

/**
 * Metric wrapper for OpenTelemetry Gauge/UpDownCounter tracking instantaneous numeric values.
 */
export class Gauge {
  private readonly gauge?: OtelUpDownCounter;
  private currentValue = 0;

  constructor(
    meter: Meter | any,
    public readonly name: string,
    public readonly unit: string = '1',
    public readonly description: string = ''
  ) {
    if (meter && typeof meter.createUpDownCounter === 'function') {
      this.gauge = meter.createUpDownCounter(name, { unit, description });
    }
  }

  /**
   * Sets the gauge to a specific target value.
   */
  public set(value: number, attributes?: Record<string, any>): void {
    const diff = value - this.currentValue;
    this.currentValue = value;
    if (this.gauge) {
      this.gauge.add(diff, attributes);
    }
  }

  /**
   * Increments the gauge by 1.
   */
  public up(attributes?: Record<string, any>): void {
    this.currentValue++;
    if (this.gauge) {
      this.gauge.add(1, attributes);
    }
  }

  /**
   * Decrements the gauge by 1.
   */
  public down(attributes?: Record<string, any>): void {
    this.currentValue--;
    if (this.gauge) {
      this.gauge.add(-1, attributes);
    }
  }

  public getValue(): number {
    return this.currentValue;
  }
}
