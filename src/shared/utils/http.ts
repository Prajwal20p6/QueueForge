import { hmacSHA256 } from './crypto';

/**
 * Builds HTTP Authentication headers using the provided API Key
 * @param apiKey - Static API Key
 * @returns Headers key-value object
 */
export function buildAuthHeader(apiKey: string): Record<string, string> {
  return {
    'X-API-Key': apiKey,
    Authorization: `ApiKey ${apiKey}`,
  };
}

/**
 * Creates outgoing signature headers using HMAC SHA-256 validation
 * @param payload - Webhook JSON body
 * @param secret - Hashing secret key
 * @returns Header containing the X-QueueForge-Signature
 */
export function buildHMACHeader(
  payload: Record<string, any>,
  secret: string
): Record<string, string> {
  const rawMessage = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const signature = hmacSHA256(rawMessage, secret);
  return {
    'X-QueueForge-Signature': signature,
  };
}

/**
 * Parses HTTP 'Retry-After' header formats into milliseconds delay
 * @param header - Content value of Retry-After (could be seconds or HTTP-Date)
 * @returns Delay in milliseconds or null if missing or unparseable
 */
export function parseRetryAfter(header: string | null | undefined): number | null {
  if (!header) {
    return null;
  }

  // 1. If it is a sequence of integer digits, it is in seconds
  if (/^\d+$/.test(header)) {
    const seconds = parseInt(header, 10);
    return seconds * 1000;
  }

  // 2. Otherwise try to parse as an HTTP-Date timestamp
  const parsedTimeMs = Date.parse(header);
  if (!isNaN(parsedTimeMs)) {
    const difference = parsedTimeMs - Date.now();
    return Math.max(0, difference); // Return remaining time (never negative)
  }

  return null;
}
