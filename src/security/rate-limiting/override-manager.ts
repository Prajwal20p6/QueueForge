import { Logger } from '../../observability/logging/logger';

/**
 * Controller class enforcing overrides permissions exceptions.
 */
export class OverrideManager {
  private readonly redis: any;
  private readonly logger: Logger;

  constructor(redis: any, logger: Logger) {
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Registers a temporary limit override.
   */
  public async grantOverride(userId: string, durationSeconds = 3600): Promise<void> {
    const key = `override:${userId}`;
    this.logger.warn(`[OverrideManager] Granting temporary limit override for user: ${userId}`);
    await this.redis.setex(key, durationSeconds, 'granted');
  }

  /**
   * Asserts if user has an active override bypass.
   */
  public async hasOverride(userId: string): Promise<boolean> {
    const key = `override:${userId}`;
    const status = await this.redis.get(key);
    return status === 'granted';
  }
}
