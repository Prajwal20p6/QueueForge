import { calculateErrorBudget } from './slo-definitions';

/**
 * Calculator checking remaining error budgets over intervals.
 */
export class BurndownChart {
  /**
   * Estimates hours remaining before total exhaustion based on current burn rate.
   */
  public projectExhaustion(remainingBudgetPercent: number, hourlyBurnRate: number): number {
    if (hourlyBurnRate <= 0) return Infinity;
    return remainingBudgetPercent / hourlyBurnRate;
  }
}
export { calculateErrorBudget };
