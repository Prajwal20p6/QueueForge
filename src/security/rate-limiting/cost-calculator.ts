/**
 * Calculator determining cost weight units based on requests properties.
 */
export class CostCalculator {
  /**
   * Evaluates cost units mapping complex операции payload bounds.
   */
  public calculateCost(action: string, payloadSize: number): number {
    if (action === 'results_ingestion') {
      if (payloadSize > 10240) return 5; // >10KB payload = 5 cost units
      return 1;
    }
    return 1;
  }
}
export { CostCalculator as Calculator };
