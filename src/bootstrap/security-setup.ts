import Redis from 'ioredis';
import { Config } from '../config';
import { Logger } from '../observability/logging/logger';
import { SecurityContext, createSecurityContext } from '../security';

/**
 * Initializes authentication strategies, validation contexts, HMAC signers, rate limiters and secrets.
 *
 * @param config - The application unified configuration object.
 * @param logger - The application logger.
 * @param redis - Connected Redis client instance.
 * @returns Configured SecurityContext object.
 */
export async function setupSecurity(
  config: Config,
  logger: Logger,
  redis: Redis
): Promise<SecurityContext> {
  logger.info('[SecuritySetup] Initializing JWT, API Key, HMAC and Rate Limiting configurations...');

  try {
    const context = createSecurityContext(config.security, redis, logger as any);

    // Validate critical secret keys presence
    if (!config.security?.jwtSecret || config.security.jwtSecret.length < 32) {
      throw new Error('Critical JWT secret key is missing or is too short (must be at least 32 characters)');
    }

    if (!config.security?.hmacSecret) {
      logger.warn('[SecuritySetup] Non-critical HMAC signing secret key is unconfigured.');
    }

    logger.info('[SecuritySetup] Security Context established. Secrets will be loaded lazily on demand.');
    return context;
  } catch (err: any) {
    logger.error('[SecuritySetup] Failed to initialize security contexts', err);
    throw err;
  }
}
export { SecurityContext };
