import client from 'prom-client';
import { metrics as otelMetrics, Meter } from '@opentelemetry/api';
import { Counter } from './counter';
import { Gauge } from './gauge';
import { Histogram } from './histogram';

/**
 * Registry configuring Prometheus metric collections and registering telemetry meters.
 */
export class MetricsRegistry {
  private readonly counters = new Map<string, Counter>();
  private readonly gauges = new Map<string, Gauge>();
  private readonly histograms = new Map<string, Histogram>();
  private readonly allMetricsMap = new Map<string, any>();
  private readonly serviceName: string;

  constructor(...args: any[]) {
    if (args[0]?.jaegerServiceName || args[0]?.metricsEnabled) {
      this.serviceName = args[0]?.jaegerServiceName || 'queueforge';
    } else if (args[0] && typeof args[0] === 'object' && args[0].getMeter) {
      this.serviceName = 'queueforge';
    } else {
      this.serviceName = 'queueforge';
    }
  }

  /**
   * Initializes prom-client registry, collecting node default CPU and memory metrics.
   */
  public async initialize(): Promise<void> {
    try {
      client.collectDefaultMetrics({
        prefix: 'queueforge_',
        register: client.register,
      });
    } catch {
      // ignore
    }
  }

  /**
   * Clears metric registrations and shuts down metric exporter registry cleanly.
   */
  public async shutdown(): Promise<void> {
    try {
      client.register.clear();
      this.counters.clear();
      this.gauges.clear();
      this.histograms.clear();
      this.allMetricsMap.clear();
    } catch {
      // ignore
    }
  }

  /**
   * Retrieves the OpenTelemetry API Meter.
   */
  public getMeter(): Meter {
    return otelMetrics.getMeter(this.serviceName);
  }

  /**
   * Retrieves the prom-client Registry.
   */
  public getRegistry(): client.Registry {
    return client.register;
  }

  public getCounter(name: string, unit?: string, description?: string): Counter {
    if (!this.counters.has(name)) {
      const counter = new Counter(this.getMeter(), name, unit, description);
      this.counters.set(name, counter);
      this.allMetricsMap.set(name, counter);
    }
    return this.counters.get(name)!;
  }

  public getGauge(name: string, unit?: string, description?: string): Gauge {
    if (!this.gauges.has(name)) {
      const gauge = new Gauge(this.getMeter(), name, unit, description);
      this.gauges.set(name, gauge);
      this.allMetricsMap.set(name, gauge);
    }
    return this.gauges.get(name)!;
  }

  public getHistogram(name: string, unit?: string, description?: string): Histogram {
    if (!this.histograms.has(name)) {
      const histogram = new Histogram(this.getMeter(), name, unit, description);
      this.histograms.set(name, histogram);
      this.allMetricsMap.set(name, histogram);
    }
    return this.histograms.get(name)!;
  }

  public registerCounter(counter: Counter): void {
    this.counters.set(counter.name, counter);
    this.allMetricsMap.set(counter.name, counter);
  }

  public registerGauge(gauge: Gauge): void {
    this.gauges.set(gauge.name, gauge);
    this.allMetricsMap.set(gauge.name, gauge);
  }

  public registerHistogram(histogram: Histogram): void {
    this.histograms.set(histogram.name, histogram);
    this.allMetricsMap.set(histogram.name, histogram);
  }

  public getAll(): Map<string, any> {
    return this.allMetricsMap;
  }

  public getMetrics(): Map<string, any> {
    return this.getAll();
  }

  public async export(): Promise<string> {
    return client.register.metrics();
  }
}
