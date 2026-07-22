import { EventEmitter } from 'events';

export interface DLQStats {
  count: number;
  size: number;
  oldest: Date | null;
  newest: Date | null;
}

export interface FailureAnalysis {
  topErrors: Array<{ error: string; count: number }>;
  topDestinations: Array<{ destinationId: string; count: number }>;
  topAgents: Array<{ agentId: string; count: number }>;
}

/**
 * Monitor auditing Dead Letter Queue growth trends, failure patterns, and dispatching cascade alerts.
 */
export class DLQMonitor extends EventEmitter {
  private readonly threshold: number;
  private readonly alertThreshold?: number;
  private readonly deliveryRepository: any;
  private readonly eventPublisher?: any;
  private readonly logger?: any;

  constructor(...args: any[]) {
    super();
    let deliveryRepository: any;
    let eventPublisher: any;
    let config: any;
    let logger: any;

    if (args[0]?.findMany || args[0]?.findByStatus || args[0]?.findDLQDeliveries) {
      deliveryRepository = args[0];
      eventPublisher = args[1];
      config = args[2];
      logger = args[3];
    } else {
      // Legacy signature: (queue, repository, logger, metrics)
      deliveryRepository = args[1];
      logger = args[2];
      config = args[3];
    }

    this.deliveryRepository = deliveryRepository;
    this.eventPublisher = eventPublisher;
    this.logger = logger;
    this.threshold = config?.dlqThreshold || config?.maxDlqThreshold || 50;
  }

  public async start(): Promise<void> {}
  public async stop(): Promise<void> {}

  public async monitor(): Promise<DLQStats> {
    return this.monitorDLQ();
  }

  /**
   * Evaluates current Dead Letter Queue volume and timestamp range bounds.
   */
  public async monitorDLQ(): Promise<DLQStats> {
    try {
      let dlqList: any[] = [];
      let totalCount = 0;

      if (this.deliveryRepository && typeof this.deliveryRepository.findDLQDeliveries === 'function') {
        const raw = await this.deliveryRepository.findDLQDeliveries();
        dlqList = Array.isArray(raw) ? raw : (raw?.data || []);
        totalCount = typeof raw?.total === 'number' ? raw.total : dlqList.length;
      } else if (this.deliveryRepository && typeof this.deliveryRepository.findByStatus === 'function') {
        const raw = await this.deliveryRepository.findByStatus('FAILED_DLQ');
        dlqList = Array.isArray(raw) ? raw : (raw?.data || []);
        totalCount = typeof raw?.total === 'number' ? raw.total : dlqList.length;
      } else if (this.deliveryRepository && typeof this.deliveryRepository.findMany === 'function') {
        const raw = await this.deliveryRepository.findMany({ status: 'FAILED_DLQ' });
        dlqList = Array.isArray(raw) ? raw : (raw?.data || []);
        totalCount = typeof raw?.total === 'number' ? raw.total : dlqList.length;
      }

      const count = totalCount || dlqList?.length || 0;
      let oldest: Date | null = null;
      let newest: Date | null = null;

      if (dlqList.length > 0) {
        const dates = dlqList.map(d => new Date(d.updatedAt || d.createdAt || Date.now()).getTime());
        oldest = new Date(Math.min(...dates));
        newest = new Date(Math.max(...dates));
      }

      const effectiveThreshold = this.alertThreshold ?? this.threshold;
      this.logger?.debug?.(`[DLQMonitor] Scanned DLQ: count=${count}, threshold=${effectiveThreshold}`);

      if (count >= effectiveThreshold) {
        await this.publishAlerts(count);
      }

      return { count, size: count, oldest, newest };
    } catch (err: any) {
      this.logger?.error?.(`[DLQMonitor] Error monitoring DLQ: ${err.message}`);
      return { count: 0, size: 0, oldest: null, newest: null };
    }
  }

  /**
   * Analyzes top failure categories, target destination bottlenecks, and triggering agent IDs.
   */
  public async analyzeFailures(): Promise<FailureAnalysis> {
    try {
      let dlqList: any[] = [];
      if (this.deliveryRepository && typeof this.deliveryRepository.findByStatus === 'function') {
        const raw = await this.deliveryRepository.findByStatus('FAILED_DLQ');
        dlqList = Array.isArray(raw) ? raw : (raw?.data || []);
      } else if (this.deliveryRepository && typeof this.deliveryRepository.findMany === 'function') {
        const raw = await this.deliveryRepository.findMany({ status: 'FAILED_DLQ' });
        dlqList = Array.isArray(raw) ? raw : (raw?.data || []);
      }

      const errorMap: Record<string, number> = {};
      const destMap: Record<string, number> = {};
      const agentMap: Record<string, number> = {};

      for (const d of dlqList || []) {
        const errStr = d.failureReason || d.lastError || 'Unknown Error';
        errorMap[errStr] = (errorMap[errStr] || 0) + 1;

        const destId = d.destinationId || 'unknown';
        destMap[destId] = (destMap[destId] || 0) + 1;

        const agentId = d.agentId || 'unknown';
        agentMap[agentId] = (agentMap[agentId] || 0) + 1;
      }

      const sortTop = (map: Record<string, number>, keyName: string) =>
        Object.entries(map)
          .map(([k, count]) => ({ [keyName]: k, count } as any))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

      return {
        topErrors: sortTop(errorMap, 'error'),
        topDestinations: sortTop(destMap, 'destinationId'),
        topAgents: sortTop(agentMap, 'agentId'),
      };
    } catch {
      return { topErrors: [], topDestinations: [], topAgents: [] };
    }
  }

  /**
   * Dispatches warning event alert when DLQ volume exceeds safety threshold.
   */
  public async publishAlerts(countOverride?: number): Promise<void> {
    const count = countOverride ?? (await this.monitorDLQ()).count;
    const effectiveThreshold = this.alertThreshold ?? this.threshold;
    if (count < effectiveThreshold) return;

    this.logger?.warn?.(`[DLQMonitor] ALERT: DLQ size (${count}) exceeded alert threshold (${effectiveThreshold})`);

    this.emit('DLQGrowthAlertEvent', { count, size: count, threshold: effectiveThreshold, timestamp: new Date() });

    if (this.eventPublisher && typeof this.eventPublisher.publish === 'function') {
      try {
        await this.eventPublisher.publish({
          type: 'alert.dlq_threshold_breached',
          severity: 'warning',
          count,
          size: count,
          threshold: effectiveThreshold,
          timestamp: new Date(),
        });
      } catch {
        // ignore
      }
    }
  }
}
