import { SLOTracker } from './slo-tracker';

/**
 * Health scoring metrics system.
 */
export class HealthScore {
  private readonly tracker: SLOTracker;

  constructor(tracker: SLOTracker) {
    this.tracker = tracker;
  }

  /**
   * Calculates composite health value based on SLO status ratios.
   */
  public async calculate(): Promise<number> {
    const statusList = await this.tracker.evaluate();
    const breached = statusList.filter((s) => !s.compliant);

    if (breached.length > 0) {
      return 100 - breached.length * 15; // Deduct 15 points per breached SLO
    }
    return 100;
  }
}
