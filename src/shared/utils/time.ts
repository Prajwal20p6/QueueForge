/**
 * Returns the current timestamp in milliseconds
 * @returns Epoch millisecond timestamp
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * Adds a specific number of seconds to a Date
 * @param date - Base Date object
 * @param seconds - Seconds count to add
 * @returns New Date offsetted
 */
export function addSeconds(date: Date, seconds: number): Date {
  const nextDate = new Date(date);
  nextDate.setSeconds(nextDate.getSeconds() + seconds);
  return nextDate;
}

/**
 * Adds a specific number of minutes to a Date
 * @param date - Base Date object
 * @param minutes - Minutes count to add
 * @returns New Date offsetted
 */
export function addMinutes(date: Date, minutes: number): Date {
  const nextDate = new Date(date);
  nextDate.setMinutes(nextDate.getMinutes() + minutes);
  return nextDate;
}

/**
 * Checks whether a given Date timestamp has expired relative to current time
 * @param expiryDate - Expiration target date
 * @returns True if current time has passed expiryDate
 */
export function isExpired(expiryDate: Date): boolean {
  return Date.now() > expiryDate.getTime();
}

/**
 * Computes the exponential retry delay backoff with a randomized jitter component
 * @param retryCount - Attempt iteration (0-indexed or 1-indexed)
 * @param baseMs - Scaling factor base delay (defaults to 1000ms)
 * @param maxMs - Upper boundary ceiling cap (defaults to 30000ms)
 * @returns Delay in milliseconds
 */
export function calculateBackoff(
  retryCount: number,
  baseMs: number = 1000,
  maxMs: number = 30000
): number {
  const exponentialDelay = baseMs * Math.pow(2, retryCount);
  const jitter = Math.random() * 1000; // randomized jitter component up to 1s
  const totalDelay = exponentialDelay + jitter;
  return Math.min(totalDelay, maxMs);
}
