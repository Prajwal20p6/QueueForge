import { QuotaTracker } from './quota-tracker';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

/**
 * Controller evaluating usage indicators alerting rules.
 */
export class QuotaAlertManager {
  constructor(
    private readonly tracker: QuotaTracker,
    private readonly logger?: Logger | any
  ) {}

  /**
   * Asserts if user usage has breached warning thresholds.
   */
  public async evaluateUserThresholds(apiKey: string, action: string = 'ingest'): Promise<'healthy' | 'warning' | 'breached'> {
    const status = await this.tracker.checkQuota(apiKey, 'FREE', action);
    if (!status.allowed) {
      this.logger?.error?.(`[QuotaAlertManager] Quota completely breached for API key: ${apiKey} on ${action}`);
      return 'breached';
    }

    const usageInfo = await this.tracker.getUsage(apiKey, 'hour');
    const usagePercent = (usageInfo.usage / (usageInfo.limit || 1)) * 100;

    if (usagePercent > 80.0) {
      this.logger?.warn?.(`[QuotaAlertManager] API Key ${apiKey} has consumed ${usagePercent.toFixed(1)}% of ${action} quota.`);
      return 'warning';
    }

    return 'healthy';
  }
}
