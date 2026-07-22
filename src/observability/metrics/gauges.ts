import client from 'prom-client';
import { Logger } from '../logging/logger';

/**
 * Thread-safe wrapper class organizing all Gauge metric operations in prom-client.
 */
export class GaugeMetrics {
  // Gauge definitions
  private readonly queueDepthMain: client.Gauge;
  private readonly queueDepthDelayed: client.Gauge;
  private readonly queueDepthDlq: client.Gauge;
  private readonly dlqSizeGauge: client.Gauge;
  private readonly workerCountGauge: client.Gauge;
  private readonly activeWorkersGauge: client.Gauge;
  private readonly circuitBreakerState: client.Gauge;
  private readonly bulkheadPoolUtilization: client.Gauge;
  private readonly databaseConnectionsActive: client.Gauge;
  private readonly databaseConnectionsIdle: client.Gauge;
  private readonly redisConnectionsActive: client.Gauge;
  private readonly redisConnectionsIdle: client.Gauge;

  constructor(_meter: any, _logger: Logger) {

    this.queueDepthMain = this.getOrRegisterGauge({
      name: 'queue_depth_main',
      help: 'Main queue depth (waiting jobs counts)',
    });

    this.queueDepthDelayed = this.getOrRegisterGauge({
      name: 'queue_depth_delayed',
      help: 'Delayed queue depth (jobs scheduled to run later)',
    });

    this.queueDepthDlq = this.getOrRegisterGauge({
      name: 'queue_depth_dlq',
      help: 'Dead Letter Queue depth (permanently failed jobs)',
    });

    this.dlqSizeGauge = this.getOrRegisterGauge({
      name: 'dlq_size',
      help: 'Total size of database failed jobs tables',
    });

    this.workerCountGauge = this.getOrRegisterGauge({
      name: 'worker_count',
      help: 'Total worker engine instances running',
    });

    this.activeWorkersGauge = this.getOrRegisterGauge({
      name: 'active_workers',
      help: 'Count of workers currently actively processing tasks',
    });

    this.circuitBreakerState = this.getOrRegisterGauge({
      name: 'circuit_breaker_state',
      help: 'Circuit breaker state representation (1 = active, 0 = inactive)',
      labelNames: ['destination_id', 'state'],
    });

    this.bulkheadPoolUtilization = this.getOrRegisterGauge({
      name: 'bulkhead_pool_utilization',
      help: 'Bulkhead pool utilization percentage representation (0.0 to 1.0)',
      labelNames: ['pool_name'],
    });

    this.databaseConnectionsActive = this.getOrRegisterGauge({
      name: 'database_connections_active',
      help: 'Active PostgreSQL pool connections count',
    });

    this.databaseConnectionsIdle = this.getOrRegisterGauge({
      name: 'database_connections_idle',
      help: 'Idle PostgreSQL pool connections count',
    });

    this.redisConnectionsActive = this.getOrRegisterGauge({
      name: 'redis_connections_active',
      help: 'Active Redis pool connections count',
    });

    this.redisConnectionsIdle = this.getOrRegisterGauge({
      name: 'redis_connections_idle',
      help: 'Idle Redis pool connections count',
    });
  }

  /**
   * Helper utility registering a new Gauge or returning an existing one if registered.
   */
  private getOrRegisterGauge(opts: client.GaugeConfiguration<string>): client.Gauge {
    return (
      (client.register.getSingleMetric(opts.name) as client.Gauge) ||
      new client.Gauge(opts)
    );
  }

  public setQueueDepth(queueName: string, depth: number): void {
    if (queueName === 'main') {
      this.queueDepthMain.set(depth);
    } else if (queueName === 'delayed') {
      this.queueDepthDelayed.set(depth);
    } else if (queueName === 'dlq') {
      this.queueDepthDlq.set(depth);
      this.dlqSizeGauge.set(depth);
    }
  }

  public setWorkerCount(count: number, active: number): void {
    this.workerCountGauge.set(count);
    this.activeWorkersGauge.set(active);
  }

  public setCircuitBreakerState(destinationId: string, state: string): void {
    const states = ['closed', 'open', 'half-open'];
    states.forEach(s => {
      this.circuitBreakerState.set({ destination_id: destinationId, state: s }, s === state ? 1 : 0);
    });
  }

  public setPoolUtilization(poolName: string, utilization: number): void {
    this.bulkheadPoolUtilization.set({ pool_name: poolName }, utilization);
  }

  public setDatabaseConnections(active: number, idle: number): void {
    this.databaseConnectionsActive.set(active);
    this.databaseConnectionsIdle.set(idle);
  }

  public setRedisConnections(active: number, idle: number): void {
    this.redisConnectionsActive.set(active);
    this.redisConnectionsIdle.set(idle);
  }
}
