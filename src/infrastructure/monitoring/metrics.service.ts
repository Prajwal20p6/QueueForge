import client from 'prom-client';

export class MetricsService {
  private static instance: MetricsService;

  public readonly registry: client.Registry;
  public readonly incomingResultsTotal: client.Counter<string>;
  public readonly deliveryAttemptsTotal: client.Counter<string>;
  public readonly deliveryDurationSeconds: client.Histogram<string>;
  public readonly circuitBreakerStatus: client.Gauge<string>;
  public readonly queueSize: client.Gauge<string>;

  private constructor() {
    this.registry = new client.Registry();

    // Collect standard node process metrics (CPU, Memory, Event Loop)
    client.collectDefaultMetrics({ register: this.registry });

    this.incomingResultsTotal = new client.Counter({
      name: 'incoming_results_total',
      help: 'Total number of incoming task results received',
      labelNames: ['status'],
    });
    this.registry.registerMetric(this.incomingResultsTotal);

    this.deliveryAttemptsTotal = new client.Counter({
      name: 'delivery_attempts_total',
      help: 'Total number of webhook/destination delivery attempts',
      labelNames: ['destination', 'status', 'attempt'],
    });
    this.registry.registerMetric(this.deliveryAttemptsTotal);

    this.deliveryDurationSeconds = new client.Histogram({
      name: 'delivery_duration_seconds',
      help: 'Delivery execution latency in seconds',
      labelNames: ['destination', 'status'],
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    });
    this.registry.registerMetric(this.deliveryDurationSeconds);

    this.circuitBreakerStatus = new client.Gauge({
      name: 'circuit_breaker_status',
      help: 'Circuit breaker status (0=closed, 1=half-open, 2=open)',
      labelNames: ['destination'],
    });
    this.registry.registerMetric(this.circuitBreakerStatus);

    this.queueSize = new client.Gauge({
      name: 'queue_size',
      help: 'Count of messages sitting in BullMQ queues',
      labelNames: ['queue', 'status'], // status: active, waiting, delayed, failed, completed
    });
    this.registry.registerMetric(this.queueSize);
  }

  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }
}
export const metricsService = MetricsService.getInstance();
