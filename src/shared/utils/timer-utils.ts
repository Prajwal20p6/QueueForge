/**
 * Timer manager tracking durations intervals
 */
export class Timer {
  private start: number;

  constructor() {
    this.start = Date.now();
  }

  public getElapsedMs(): number {
    return Date.now() - this.start;
  }

  public reset(): void {
    this.start = Date.now();
  }
}

/**
 * Returns promise executing timeout sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes a callback after delay asynchronously
 */
export async function setTimeoutAsync(fn: () => Promise<void> | void, delayMs: number): Promise<void> {
  await sleep(delayMs);
  await fn();
}
