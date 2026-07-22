import { Logger } from '../../observability/logging/logger';

/**
 * Controller class checking temporary burst tokens limits.
 */
export class BurstAllowanceManager {
  private readonly redis: any;
  private readonly logger: Logger;

  constructor(redis: any, logger: Logger) {
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Asserts if request can consume burst tokens.
   */
  public async consumeBurstTokens(userId: string, tokensCount = 1): Promise<boolean> {
    const key = `burst:${userId}`;
    const rawVal = await this.redis.get(key);
    const balance = rawVal ? parseInt(rawVal, 10) : 50; // default burst capacity = 50 tokens

    if (balance >= tokensCount) {
      await this.redis.setex(key, 60, String(balance - tokensCount));
      return true;
    }

    this.logger.warn(`[BurstAllowanceManager] Burst tokens exhausted for user: ${userId}`);
    return false;
  }
}
export { Logger };
