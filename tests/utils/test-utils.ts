import { v4 as uuidv4 } from 'uuid';

/**
 * Pauses execution for the specified number of milliseconds.
 * @param ms - Duration in milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Polls a condition function until it returns true or the timeout elapses.
 * @param condition - Async predicate to evaluate.
 * @param timeoutMs - Maximum wait time in milliseconds (default: 10000).
 * @param pollIntervalMs - Polling interval in milliseconds (default: 100).
 * @throws {Error} if the condition does not become true within the timeout.
 */
export async function waitUntil(
  condition: () => Promise<boolean>,
  timeoutMs = 10000,
  pollIntervalMs = 100
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await condition()) return;
    await sleep(pollIntervalMs);
  }
  throw new Error(
    `[waitUntil] Condition did not become true within ${timeoutMs}ms.`
  );
}

/**
 * Retries an async function up to maxAttempts times with an optional delay between retries.
 * @param fn - Async function to retry.
 * @param maxAttempts - Maximum number of attempts (default: 3).
 * @param delayMs - Delay between attempts in milliseconds (default: 500).
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 500
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts) {
        await sleep(delayMs);
      }
    }
  }
  throw lastError ?? new Error('[retry] All attempts failed.');
}

/**
 * Polls an async function until its result equals the expected value within a timeout.
 * @param fn - Async function that returns the value to check.
 * @param expected - Expected result value.
 * @param timeoutMs - Maximum wait time in milliseconds (default: 10000).
 * @param pollIntervalMs - Polling interval in milliseconds (default: 100).
 */
export async function expectToEventuallyEqual<T>(
  fn: () => Promise<T>,
  expected: T,
  timeoutMs = 10000,
  pollIntervalMs = 100
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let last: T | undefined;
  while (Date.now() < deadline) {
    last = await fn();
    if (JSON.stringify(last) === JSON.stringify(expected)) return;
    await sleep(pollIntervalMs);
  }
  throw new Error(
    `[expectToEventuallyEqual] Expected ${JSON.stringify(expected)} but got ` +
      `${JSON.stringify(last)} after ${timeoutMs}ms.`
  );
}

/**
 * Generates a unique test identifier string.
 * @returns A UUID v4 prefixed with 'test-'.
 */
export function generateTestId(): string {
  return `test-${uuidv4()}`;
}

/**
 * Generates a unique test email address with a deterministic test domain.
 * @returns A formatted test email string.
 */
export function generateTestEmail(): string {
  const id = uuidv4().replace(/-/g, '').slice(0, 8);
  return `test-${id}@oneinbox.test`;
}

/**
 * Normalizes a URL by trimming trailing slashes and lowercasing the scheme and host.
 * @param url - Raw URL string to normalize.
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, '')}`;
  } catch {
    return url.trim().replace(/\/+$/, '');
  }
}
