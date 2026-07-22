/**
 * Service managing retry execution and batch retries for failed deliveries.
 */
export class RetryManagerService {
  constructor(
    private readonly scheduleRetryService?: any,
    logger?: any
  ) {
    if (logger) {
      logger.debug?.('[RetryManagerService] Initialized');
    }
  }

  public async retryDelivery(deliveryId: string): Promise<{ deliveryId: string; nextRetryAt: Date }> {
    if (this.scheduleRetryService?.scheduleRetry) {
      await this.scheduleRetryService.scheduleRetry(deliveryId);
    }
    return {
      deliveryId,
      nextRetryAt: new Date(),
    };
  }

  public async retryBatch(deliveryIds: string[]): Promise<{ successCount: number; failureCount: number; details: any[] }> {
    const details = [];
    let successCount = 0;
    let failureCount = 0;

    for (const id of deliveryIds) {
      try {
        await this.retryDelivery(id);
        details.push({ id, success: true });
        successCount++;
      } catch (err: any) {
        details.push({ id, success: false, error: err.message });
        failureCount++;
      }
    }

    return { successCount, failureCount, details };
  }
}
