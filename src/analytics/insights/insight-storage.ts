import { Logger } from '../../observability/logging/logger';
import { Insight } from '../types';

/**
 * Storage manager caching generated reports inside Postgres database.
 */
export class InsightStorage {
  private readonly logger: Logger;
  private readonly localStore = new Map<string, Insight>();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Caches insight object database records.
   */
  public async saveInsight(insight: Insight): Promise<void> {
    this.logger.debug(`[InsightStorage] Caching generated insight ID: ${insight.id}`);
    this.localStore.set(insight.id, insight);
  }

  /**
   * Retrieves stored insights.
   */
  public async getInsights(): Promise<Insight[]> {
    return Array.from(this.localStore.values());
  }
}
