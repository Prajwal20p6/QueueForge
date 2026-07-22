/**
 * Error assertion helper utilities.
 */
export class ErrorHelper {
  public static async shouldThrowAsync(
    fn: () => Promise<any>,
    expectedErrorType?: any
  ): Promise<void> {
    try {
      await fn();
    } catch (err: any) {
      if (expectedErrorType && !(err instanceof expectedErrorType)) {
        throw new Error(`Expected error instance of ${expectedErrorType.name}, got ${err.constructor.name}`);
      }
      return;
    }
    throw new Error('Expected function to throw error, but it succeeded.');
  }
}
