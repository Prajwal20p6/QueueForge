export interface HealthCheckItem {
  name: string;
  weight: number;
  checker: () => Promise<boolean>;
  passed: boolean;
}

export interface HealthReport {
  score: number;
  checks: Array<{ name: string; passed: boolean; weight: number }>;
}

/**
 * HealthScore calculates a composite weighted health score (0-100) for system health evaluation.
 */
export class HealthScore {
  private readonly checks: HealthCheckItem[] = [];

  constructor(_metricsRegistry?: any) {}

  /**
   * Registers a named health check with weighting factor.
   */
  public addCheck(name: string, weight: number, checker: () => Promise<boolean>): void {
    this.checks.push({
      name,
      weight,
      checker,
      passed: true,
    });
  }

  /**
   * Runs all registered health checks.
   */
  public async run(): Promise<void> {
    for (const item of this.checks) {
      try {
        item.passed = await item.checker();
      } catch {
        item.passed = false;
      }
    }
  }

  /**
   * Computes current composite weighted health score.
   */
  public calculate(): number {
    if (this.checks.length === 0) return 100;

    const totalWeight = this.checks.reduce((acc, curr) => acc + curr.weight, 0);
    if (totalWeight <= 0) return 100;

    const passedWeight = this.checks.reduce((acc, curr) => acc + (curr.passed ? curr.weight : 0), 0);
    return Math.round((passedWeight / totalWeight) * 100);
  }

  /**
   * Returns complete health score report breakdown.
   */
  public getReport(): HealthReport {
    const score = this.calculate();
    return {
      score,
      checks: this.checks.map(c => ({
        name: c.name,
        passed: c.passed,
        weight: c.weight,
      })),
    };
  }
}
