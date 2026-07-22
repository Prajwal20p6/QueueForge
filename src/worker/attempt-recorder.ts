/**
 * Audit trail recorder persisting execution attempt records and outcome metadata.
 */
export class AttemptRecorder {
  private readonly attemptRepository: any;
  private readonly logger?: any;

  constructor(...args: any[]) {
    this.attemptRepository = args[0];
    this.logger = args[1];
  }

  /**
   * Records execution attempt details atomically.
   */
  public async record(
    deliveryId: string,
    arg2: any,
    arg3?: any
  ): Promise<any> {
    try {
      let attemptObj = typeof arg2 === 'object' ? arg2 : arg3;
      let attemptNumber = typeof arg2 === 'number' ? arg2 : 1;

      if (!attemptObj) {
        attemptObj = {};
      }

      if (typeof arg2 !== 'number') {
        if (this.attemptRepository && typeof this.attemptRepository.findLatestAttemptNumber === 'function') {
          const lastNum = await this.attemptRepository.findLatestAttemptNumber(deliveryId);
          attemptNumber = (lastNum || 0) + 1;
        } else if (this.attemptRepository && typeof this.attemptRepository.findByDeliveryId === 'function') {
          const existing = await this.attemptRepository.findByDeliveryId(deliveryId);
          attemptNumber = (existing?.length || 0) + 1;
        }
      }

      const attemptRecord = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        deliveryId,
        attemptNumber,
        statusCode: attemptObj.statusCode || attemptObj.responseStatus || (attemptObj.error ? 500 : 200),
        latencyMs: attemptObj.latencyMs || attemptObj.responseTimeMs || 0,
        errorMessage: attemptObj.error?.message || attemptObj.errorMessage || (typeof attemptObj.error === 'string' ? attemptObj.error : null),
        responsePayload: attemptObj.response,
        attemptedAt: new Date(),
      };

      if (this.attemptRepository && typeof this.attemptRepository.recordAttempt === 'function') {
        const repoData = {
          responseStatus: attemptRecord.statusCode,
          responseTimeMs: attemptRecord.latencyMs,
          errorMessage: attemptRecord.errorMessage,
        };
        await this.attemptRepository.recordAttempt(deliveryId, attemptNumber, repoData);
      } else if (this.attemptRepository && typeof this.attemptRepository.create === 'function') {
        await this.attemptRepository.create(attemptRecord);
      } else if (this.attemptRepository && typeof this.attemptRepository.save === 'function') {
        await this.attemptRepository.save(attemptRecord);
      }

      this.logger?.debug?.(`[AttemptRecorder] Recorded attempt #${attemptNumber} for delivery "${deliveryId}"`);
      return attemptRecord;
    } catch (err: any) {
      this.logger?.error?.(`[AttemptRecorder] Failed to record attempt for delivery "${deliveryId}": ${err.message}`);
      return null;
    }
  }

  public async getAttemptHistory(deliveryId: string): Promise<any[]> {
    if (this.attemptRepository && typeof this.attemptRepository.getAttemptHistory === 'function') {
      return await this.attemptRepository.getAttemptHistory(deliveryId);
    } else if (this.attemptRepository && typeof this.attemptRepository.findByDeliveryId === 'function') {
      return (await this.attemptRepository.findByDeliveryId(deliveryId)) || [];
    }
    return [];
  }

  public async recordSuccess(deliveryId: string, latencyMs: number, response?: any): Promise<any> {
    return this.record(deliveryId, { latencyMs, response });
  }

  public async recordFailure(
    deliveryId: string,
    latencyMs: number,
    statusCode?: number,
    error?: Error | any
  ): Promise<any> {
    return this.record(deliveryId, { latencyMs, statusCode, error });
  }
}
