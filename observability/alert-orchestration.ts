import { SLOTracker } from './slo-tracker';
import { Logger } from '../src/observability/logging/logger';

/**
 * Orchestrator class managing deduplication and routing of SLI metrics notifications.
 */
export class AlertOrchestrator {
  private readonly tracker: SLOTracker;
  private readonly logger: Logger;
  private activeAlertsCount = 0;

  constructor(tracker: SLOTracker, logger: Logger) {
    this.tracker = tracker;
    this.logger = logger;
  }

  /**
   * Evaluates alerts parameters.
   */
  public async orchestrate(): Promise<void> {
    const statuses = await this.tracker.evaluate();
    const breached = statuses.filter((s) => !s.compliant);

    if (breached.length > 0) {
      this.logger.warn(`[AlertOrchestrator] Breached SLOs count: ${breached.length}`);
      this.activeAlertsCount += breached.length;
    } else {
      this.activeAlertsCount = 0;
    }
  }

  public getActiveAlertsCount(): number {
    return this.activeAlertsCount;
  }
}
