/**
 * Safely fetches env key value returning fallback if unset
 */
export function getEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

/**
 * Sinks environmental variable throwing if missing
 */
export function getEnvOrThrow(key: string): string {
  const val = process.env[key];
  if (val === undefined) {
    throw new Error(`Required environmental variable: ${key} is missing`);
  }
  return val;
}

/**
 * Parses numeric properties
 */
export function parseEnvAsNumber(key: string, fallback = 0): number {
  const val = process.env[key];
  if (val === undefined) return fallback;
  const num = parseInt(val, 10);
  return isNaN(num) ? fallback : num;
}

/**
 * Parses boolean flags
 */
export function parseEnvAsBoolean(key: string, fallback = false): boolean {
  const val = process.env[key];
  if (val === undefined) return fallback;
  return val.toLowerCase() === 'true' || val === '1';
}
