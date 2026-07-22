import { QueueMonitor } from './queue-monitor';
import { SheddingStrategy, selectJobsToShed } from './shedding-strategy';
import { BackpressureStatus } from '../types';

export interface ShedResult {
  shedCount: number;
  shedPercentage: number;
}

/**
 * Controller monitoring queue pressure, calculating shedding percentages, and triggering alarms.
 */
export class BackpressureMonitor {
  constructor(
    private readonly queueMonitor: QueueMonitor,
    private readonly strategy: SheddingStrategy = SheddingStrategy.FIFO,
    private readonly config?: any,
    private readonly logger?: any
  ) {}

  public async getStatus(): Promise<BackpressureStatus & { level: string }> {
    const depth = await this.queueMonitor.getQueueDepth();
    const threshold = this.config?.backpressureQueueDepthThreshold || this.config?.queueDepthThreshold || 1000;
    const isUnderPressure = await this.queueMonitor.isUnderPressure();
    const level = await this.queueMonitor.getPressureLevel();

    return {
      isUnderPressure,
      depth,
      threshold,
      strategy: this.strategy,
      level,
    };
  }

  public alarm(level: string): void {
    if (level === 'critical' || level === 'high') {
      this.logger?.warn?.(`[BackpressureMonitor] ALARM TRIGGERED: Pipeline backpressure reached ${level.toUpperCase()} level`);
    }
  }

  /**
   * Checks current queue depth and sheds excess jobs if system is under backpressure.
   */
  public async checkAndShed(jobs?: any[]): Promise<ShedResult> {
    const status = await this.getStatus();

    if (!status.isUnderPressure && status.level !== 'critical' && status.level !== 'high') {
      return { shedCount: 0, shedPercentage: 0 };
    }

    this.alarm(status.level);

    let shedPercentage = 0;
    if (status.level === 'critical') {
      shedPercentage = 25;
    } else if (status.level === 'high') {
      shedPercentage = 10;
    } else {
      shedPercentage = 5;
    }

    if (!jobs || jobs.length === 0) {
      return { shedCount: 0, shedPercentage };
    }

    const toShed = selectJobsToShed(jobs, shedPercentage, this.strategy);
    this.logger?.info?.(`[BackpressureMonitor] Shedding ${toShed.length} jobs (${shedPercentage}%) under ${status.level} backpressure`);

    return {
      shedCount: toShed.length,
      shedPercentage,
    };
  }
}
