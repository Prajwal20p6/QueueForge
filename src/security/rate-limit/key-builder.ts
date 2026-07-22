import { hashSHA256 } from '../../shared/utils/crypto';

/**
 * Builds a deterministic Redis key to uniquely identify rate limiting scopes.
 * Supports:
 * - buildRateLimitKey(apiKey, endpoint, method) -> rate_limit:{apiKey}:{endpoint}:{method}
 * - buildRateLimitKey(apiKey, endpoint, userId) -> rate_limit:{type}:{identifier}:{path} (legacy format)
 */
export function buildRateLimitKey(
  apiKeyOrKey?: string,
  endpoint?: string,
  methodOrUserId?: string
): string {
  const isMethod =
    methodOrUserId &&
    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].includes(
      methodOrUserId.toUpperCase()
    );

  if (isMethod) {
    // New signature format: rate_limit:{api_key}:{endpoint}:{method}
    const cleanEndpoint = endpoint ? endpoint.trim().replace(/\//g, '_').toLowerCase() : 'global';
    const method = methodOrUserId.toLowerCase();
    return `rate_limit:${apiKeyOrKey}:${cleanEndpoint}:${method}`;
  }

  // Fallback to legacy signature: rate_limit:{type}:{identifier}:{path}
  let type = 'global';
  let identifier = 'system';
  const userId = methodOrUserId; // in legacy, the third param is userId

  if (userId) {
    type = 'user';
    identifier = userId;
  } else if (apiKeyOrKey) {
    type = 'apikey';
    identifier = apiKeyOrKey;
  }

  if (identifier.length > 32) {
    identifier = hashSHA256(identifier).substring(0, 16);
  }

  const path = endpoint ? endpoint.trim().replace(/\//g, '_').toLowerCase() : 'global';
  return `rate_limit:${type}:${identifier}:${path}`;
}
export { hashSHA256 };
