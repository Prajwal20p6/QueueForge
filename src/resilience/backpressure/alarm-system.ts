import { ResilienceConfig } from '../../config/resilience';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';
import { AlarmLevel } from '../types';

export interface AlarmEvent {
  level: AlarmLevel;
  depth: number;
  timestamp: Date;
}

/**
 * Audit system evaluating queue limits and storing historical alarm state changes.
 */
export class AlarmSystem {
  private readonly history: AlarmEvent[] = [];

  constructor(
    _config: ResilienceConfig,
    private readonly logger: Logger,
    _metrics: any
  ) {}

  /**
   * Compares active depth against maxCapacity to assign an AlarmLevel.
   */
  public checkThreshold(queueDepth: number, maxCapacity: number): AlarmLevel {
    if (maxCapacity <= 0) return 'GREEN';

    const percentage = (queueDepth / maxCapacity) * 100;

    if (percentage >= 99) return 'CRITICAL';
    if (percentage >= 90) return 'RED';
    if (percentage >= 70) return 'YELLOW';
    return 'GREEN';
  }

  /**
   * Logs and records an alarm trigger event.
   */
  public recordAlarm(level: AlarmLevel, depth: number): void {
    const event: AlarmEvent = {
      level,
      depth,
      timestamp: new Date(),
    };

    this.history.unshift(event);

    // Limit historical arrays size to avoid memory leaks
    if (this.history.length > 100) {
      this.history.pop();
    }

    if (level === 'RED' || level === 'CRITICAL') {
      this.logger.error(`[Backpressure Alarm] System has reached "${level}" status! Active Queue Depth: ${depth}`);
    } else if (level === 'YELLOW') {
      this.logger.warn(`[Backpressure Alarm] System status changed to "${level}". Active Queue Depth: ${depth}`);
    } else {
      this.logger.info(`[Backpressure Alarm] System status is stable ("${level}"). Depth: ${depth}`);
    }
  }

  /**
   * Returns standard alarm change history list.
   */
  public async getAlarmHistory(limit = 10): Promise<AlarmEvent[]> {
    return this.history.slice(0, limit);
  }
}
