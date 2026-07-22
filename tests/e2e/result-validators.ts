export class ResultValidator {
  public static validateHappyPath(outcome: any): void {
    if (!outcome || outcome.status !== 'COMPLETED') {
      throw new Error(`Expected outcome status COMPLETED, got ${outcome?.status}`);
    }
  }
}
