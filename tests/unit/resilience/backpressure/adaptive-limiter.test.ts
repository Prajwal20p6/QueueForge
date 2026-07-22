import { AdaptiveLimiter } from '../../../../src/resilience/backpressure/adaptive-limiter';
import { QueueMonitor } from '../../../../src/resilience/backpressure/queue-monitor';

describe('AdaptiveLimiter Unit Tests', () => {
  let mockQueueMonitor: jest.Mocked<QueueMonitor>;
  let limiter: AdaptiveLimiter;

  beforeEach(() => {
    mockQueueMonitor = {
      getPressureLevel: jest.fn(),
    } as any;

    limiter = new AdaptiveLimiter(mockQueueMonitor, { initialConcurrency: 20, minConcurrency: 5, maxConcurrency: 50 });
  });

  it('should scale down concurrency under critical pressure stage', async () => {
    mockQueueMonitor.getPressureLevel.mockResolvedValue('critical');

    const adjusted = await limiter.adjustConcurrency(20);
    expect(adjusted).toBe(10); // 50% scale down
  });

  it('should scale up concurrency under low pressure stage', async () => {
    mockQueueMonitor.getPressureLevel.mockResolvedValue('low');

    const adjusted = await limiter.adjustConcurrency(20);
    expect(adjusted).toBe(22); // 10% scale up
  });
});
