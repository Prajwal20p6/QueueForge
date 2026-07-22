import { SLOTracker } from '../../../observability/slo-tracker';
import { SLODefinitions } from '../../../observability/slo-definitions';
import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';
import { MockFactory } from '../../helpers/mocks';

describe('SLO Tracking Integration Tests', () => {
  beforeAll(async () => {
    await setupIntegrationTestStack();
  });

  afterAll(async () => {
    await teardownIntegrationTestStack();
  });

  it('should evaluate tracker compliance against configured metrics base registry', async () => {
    const mockMetrics = MockFactory.createMockMetricsRegistry();
    const mockLogger = MockFactory.createMockLogger();

    const tracker = new SLOTracker(SLODefinitions, mockMetrics, mockLogger);
    const results = await tracker.evaluate();

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBeDefined();
  });
});
