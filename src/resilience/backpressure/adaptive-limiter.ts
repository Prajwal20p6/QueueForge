import { QueueMonitor } from './queue-monitor';

/**
 * Dynamically adjusts worker concurrency limits and shedding toggles based on live queue load.
 */
export class AdaptiveLimiter {
  private minConcurrency = 1;
  private maxConcurrency = 100;
  private currentConcurrency = 20;

  constructor(
    private readonly queueMonitor: QueueMonitor,
    config?: any,
    private readonly logger?: any
  ) {
    this.minConcurrency = config?.minConcurrency || 1;
    this.maxConcurrency = config?.maxConcurrency || 100;
    this.currentConcurrency = config?.initialConcurrency || 20;
  }

  public async getMaxConcurrency(): Promise<number> {
    return this.currentConcurrency;
  }

  public async isSheddingEnabled(): Promise<boolean> {
    const level = await this.queueMonitor.getPressureLevel();
    return level === 'high' || level === 'critical';
  }

  /**
   * Adjusts current concurrency gradually according to pressure stage.
   */
  public async adjustConcurrency(current: number): Promise<number> {
    const level = await this.queueMonitor.getPressureLevel();
    let target = current;

    if (level === 'critical') {
      // Step-down by 50%
      target = Math.max(this.minConcurrency, Math.floor(current * 0.5));
    } else if (level === 'high') {
      // Step-down by 20%
      target = Math.max(this.minConcurrency, Math.floor(current * 0.8));
    } else if (level === 'low') {
      // Step-up by 10%
      target = Math.min(this.maxConcurrency, Math.ceil(current * 1.1));
    }

    if (target !== current) {
      this.logger?.info?.(
        `[AdaptiveLimiter] Concurrency adjusted: ${current} -> ${target} (Pressure Level: ${level})`
      );
      this.currentConcurrency = target;
    }

    return target;
  }
}
