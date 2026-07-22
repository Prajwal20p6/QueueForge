import { AlertOrchestrator } from '../../../observability/alert-orchestration';
import { SLOTracker } from '../../../observability/slo-tracker';
import { SLODefinitions } from '../../../observability/slo-definitions';
import { setupIntegrationTestStack } from '../setup';
import { teardownIntegrationTestStack } from '../teardown';
import { MockFactory } from '../../helpers/mocks';

describe('Alert Orchestration Integration Tests', () => {
  beforeAll(async () => {
    await setupIntegrationTestStack();
  });

  afterAll(async () => {
    await teardownIntegrationTestStack();
  });

  it('should evaluate alerts orchestration states correctly', async () => {
    const mockMetrics = MockFactory.createMockMetricsRegistry();
    const mockLogger = MockFactory.createMockLogger();

    const tracker = new SLOTracker(SLODefinitions, mockMetrics, mockLogger);
    const orchestrator = new AlertOrchestrator(tracker, mockLogger);

    await orchestrator.orchestrate();
    expect(orchestrator.getActiveAlertsCount()).toBe(0); // Stable simulated compliance returns 0 breached alerts
  });
});
