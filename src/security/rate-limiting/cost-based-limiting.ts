import { CostCalculator } from './cost-calculator';

/**
 * Controller checking request costs against client budgets.
 */
export class CostBasedLimiter {
  private readonly redis: any;
  private readonly calculator: CostCalculator;

  constructor(redis: any, calculator: CostCalculator) {
    this.redis = redis;
    this.calculator = calculator;
  }

  /**
   * Asserts if request can be processed within active cost budget.
   */
  public async canAffordRequest(userId: string, action: string, payloadSize: number, hourlyBudget = 100): Promise<boolean> {
    const key = `cost:${userId}`;
    const cost = this.calculator.calculateCost(action, payloadSize);

    const rawVal = await this.redis.get(key);
    const balance = rawVal ? parseInt(rawVal, 10) : 0;

    if (balance + cost > hourlyBudget) {
      return false;
    }

    await this.redis.setex(key, 3600, String(balance + cost));
    return true;
  }
}
