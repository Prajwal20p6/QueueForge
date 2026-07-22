import { hashSHA256 } from '../../shared/utils/crypto';

/**
 * Builds a deterministic idempotency key from a task result and target destination ID
 * Format: first 16 chars of SHA256 hash + ':' + full SHA256 hash
 */
export function buildIdempotencyKey(taskResultId: string, destinationId: string): string {
  if (!taskResultId || !destinationId) {
    throw new Error('TaskResultId and DestinationId must be provided to construct composite key');
  }
  const input = `${taskResultId.trim()}:${destinationId.trim()}`;
  const fullHash = hashSHA256(input);
  const prefix = fullHash.substring(0, 16);
  return `${prefix}:${fullHash}`;
}

/**
 * Validates that an idempotency key matches the format of prefix:fullHash
 */
export function isValidIdempotencyKey(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }
  const parts = key.split(':');
  if (parts.length !== 2) {
    return false;
  }
  const [prefix, fullHash] = parts;
  if (prefix.length !== 16 || fullHash.length !== 64) {
    return false;
  }
  return fullHash.startsWith(prefix);
}
