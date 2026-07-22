import { SLOTracker } from '../../../observability/slo-tracker';
import { SLODefinitions } from '../../../observability/slo-definitions';
import { MockFactory } from '../../helpers/mocks';

describe('SLOTracker Unit Tests', () => {
  it('should evaluate all SLOs and assert compliant values', async () => {
    const mockMetrics = MockFactory.createMockMetricsRegistry();
    const mockLogger = MockFactory.createMockLogger();

    const tracker = new SLOTracker(SLODefinitions, mockMetrics, mockLogger);
    const statuses = await tracker.evaluate();

    expect(statuses.length).toBe(SLODefinitions.length);
    statuses.forEach((s) => {
      expect(s.compliant).toBe(true);
    });
  });
});
