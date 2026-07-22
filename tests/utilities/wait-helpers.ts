/**
 * Async waiting utilities for test verification loops.
 */
export class WaitHelper {
  public static async waitFor(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public static async waitForCondition(
    condition: () => Promise<boolean>,
    timeoutMs = 5000,
    intervalMs = 100
  ): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      if (await condition()) {
        return;
      }
      await WaitHelper.waitFor(intervalMs);
    }
    throw new Error(`Timed out after ${timeoutMs}ms waiting for condition.`);
  }
}
