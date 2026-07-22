import { QuotaTracker } from './quota-tracker';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

/**
 * Manager orchestrating quotas overrides parameters.
 */
export class QuotaManager {
  constructor(
    private readonly tracker: QuotaTracker,
    private readonly logger?: Logger | any
  ) {}

  /**
   * Modifies quota definition for specified user.
   */
  public async updateUserQuotaTier(userId: string, tier: string): Promise<void> {
    this.logger?.info?.(`[QuotaManager] Updating user: ${userId} to subscription tier: ${tier}`);
    await this.tracker.resetQuota(userId);
  }
}
