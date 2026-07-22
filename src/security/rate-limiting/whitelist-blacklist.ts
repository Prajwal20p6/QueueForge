/**
 * Controller enforcing operational bypass whitelists and block blacklists.
 */
export class WhitelistBlacklistManager {
  private readonly redis: any;

  constructor(redis: any) {
    this.redis = redis;
  }

  /**
   * Registers IP/User inside blacklist storage.
   */
  public async blacklist(identifier: string): Promise<void> {
    const key = `blacklist:${identifier}`;
    await this.redis.set(key, 'blocked');
  }

  /**
   * Asserts if IP/User is blacklisted.
   */
  public async isBlacklisted(identifier: string): Promise<boolean> {
    const key = `blacklist:${identifier}`;
    const status = await this.redis.get(key);
    return status === 'blocked';
  }

  /**
   * Registers IP/User inside whitelist bypass storage.
   */
  public async whitelist(identifier: string): Promise<void> {
    const key = `whitelist:${identifier}`;
    await this.redis.set(key, 'allowed');
  }

  /**
   * Asserts if IP/User is whitelisted.
   */
  public async isWhitelisted(identifier: string): Promise<boolean> {
    const key = `whitelist:${identifier}`;
    const status = await this.redis.get(key);
    return status === 'allowed';
  }
}
