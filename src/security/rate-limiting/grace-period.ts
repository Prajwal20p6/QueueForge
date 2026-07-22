import { Logger } from '../../observability/logging/logger';

/**
 * Controller managing temporary grace periods bypass exceptions.
 */
export class GracePeriodManager {
  private readonly redis: any;
  private readonly logger: Logger;

  constructor(redis: any, logger: Logger) {
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Registers a grace period exception.
   */
  public async grantGracePeriod(userId: string, durationSeconds = 3600): Promise<void> {
    const key = `grace:${userId}`;
    this.logger.warn(`[GracePeriodManager] Granting grace period exception to user: ${userId}`);
    await this.redis.setex(key, durationSeconds, 'active');
  }

  /**
   * Asserts if user has an active grace period.
   */
  public async isInGracePeriod(userId: string): Promise<boolean> {
    const key = `grace:${userId}`;
    const status = await this.redis.get(key);
    return status === 'active';
  }
}
