import { BackpressureMonitor } from '../../../../src/resilience/backpressure/backpressure-monitor';
import { QueueMonitor } from '../../../../src/resilience/backpressure/queue-monitor';
import { SheddingStrategy } from '../../../../src/resilience/backpressure/shedding-strategy';

describe('BackpressureMonitor Unit Tests', () => {
  let mockQueueMonitor: jest.Mocked<QueueMonitor>;
  let monitor: BackpressureMonitor;

  beforeEach(() => {
    mockQueueMonitor = {
      getQueueDepth: jest.fn(),
      isUnderPressure: jest.fn(),
      getPressureLevel: jest.fn(),
      getPercentageOfMax: jest.fn(),
    } as any;

    monitor = new BackpressureMonitor(mockQueueMonitor, SheddingStrategy.FIFO, { queueDepthThreshold: 100 });
  });

  it('should query backpressure status and pressure level stage', async () => {
    mockQueueMonitor.getQueueDepth.mockResolvedValue(80);
    mockQueueMonitor.isUnderPressure.mockResolvedValue(true);
    mockQueueMonitor.getPressureLevel.mockResolvedValue('high');

    const status = await monitor.getStatus();
    expect(status.isUnderPressure).toBe(true);
    expect(status.depth).toBe(80);
    expect(status.level).toBe('high');
  });

  it('should trigger shedding candidate selection when under pressure', async () => {
    mockQueueMonitor.getQueueDepth.mockResolvedValue(80);
    mockQueueMonitor.isUnderPressure.mockResolvedValue(true);
    mockQueueMonitor.getPressureLevel.mockResolvedValue('high');

    const jobs = Array.from({ length: 10 }, (_, i) => ({ id: `job-${i}` }));
    const result = await monitor.checkAndShed(jobs);

    expect(result.shedCount).toBeGreaterThan(0);
    expect(result.shedPercentage).toBe(10);
  });
});
