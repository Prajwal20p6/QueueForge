import { CustomMetric } from '../types';

/**
 * Controller class letting users define custom business metrics parameters.
 */
export class CustomMetrics {
  private readonly store = new Map<string, CustomMetric>();

  /**
   * Registers a user-defined custom metric.
   */
  public async defineMetric(name: string, val: number): Promise<void> {
    this.store.set(name, {
      name,
      value: val,
      timestamp: new Date(),
    });
  }

  /**
   * Retrieves custom metric parameters value.
   */
  public async queryMetric(name: string): Promise<CustomMetric | null> {
    return this.store.get(name) || null;
  }
}
