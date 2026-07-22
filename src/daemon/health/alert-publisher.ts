/**
 * Alert publisher dispatching system health degradation alerts and service recovery events to domain event brokers.
 */
export class AlertPublisher {
  constructor(
    private readonly eventPublisher?: any,
    private readonly logger?: any
  ) {}

  /**
   * Dispatches warning or critical health degradation alerts.
   */
  public async publishAlert(
    severity: 'warning' | 'critical',
    message: string,
    details?: any
  ): Promise<void> {
    const event = {
      type: `alert.system_health_${severity}`,
      severity,
      message,
      details,
      timestamp: new Date(),
    };

    if (severity === 'critical') {
      this.logger?.error?.(`[AlertPublisher] CRITICAL ALERT: ${message}`, details);
    } else {
      this.logger?.warn?.(`[AlertPublisher] WARNING ALERT: ${message}`, details);
    }

    if (this.eventPublisher && typeof this.eventPublisher.publish === 'function') {
      try {
        await this.eventPublisher.publish(event);
      } catch (err: any) {
        this.logger?.error?.(`[AlertPublisher] Failed to publish health alert event: ${err.message}`);
      }
    }
  }

  /**
   * Dispatches service recovery event when a degraded or unhealthy component returns to healthy state.
   */
  public async publishRecovery(serviceName: string): Promise<void> {
    const message = `Service "${serviceName}" has recovered and returned to HEALTHY status.`;
    this.logger?.info?.(`[AlertPublisher] RECOVERY: ${message}`);

    if (this.eventPublisher && typeof this.eventPublisher.publish === 'function') {
      try {
        await this.eventPublisher.publish({
          type: 'alert.service_recovered',
          serviceName,
          message,
          timestamp: new Date(),
        });
      } catch {
        // ignore
      }
    }
  }
}
