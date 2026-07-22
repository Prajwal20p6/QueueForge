/**
 * Parses an ISO 8601 string to a UTC Date object
 */
export function parseISODate(isoStr: string): Date {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid ISO date format');
  }
  return d;
}

/**
 * Formats a Date object as a UTC ISO string
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Adds minutes to a Date object returning a new Date
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

/**
 * Returns current timestamp in epoch seconds
 */
export function getTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}
export { formatDate as toISOString };
