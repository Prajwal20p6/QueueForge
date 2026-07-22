import { MetricsExporter } from '../../../../src/observability/metrics/exporter';
import { MetricsRegistry } from '../../../../src/observability/metrics/metrics-registry';

describe('MetricsExporter Unit Tests', () => {
  let exporter: MetricsExporter;
  let registry: MetricsRegistry;
  let logger: any;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    registry = new MetricsRegistry({ metricsEnabled: true } as any, logger);
    exporter = new MetricsExporter(registry, logger);
  });

  it('should export text and JSON formats diagnostics', async () => {
    await registry.initialize();

    const prometheusText = await exporter.export();
    expect(prometheusText).toBeDefined();

    const syncText = exporter.exportPrometheus();
    expect(syncText).toBeDefined();

    const jsonFormat = exporter.exportJSON();
    expect(jsonFormat.timestamp).toBeDefined();
    expect(jsonFormat.metrics).toBeDefined();
  });
});
