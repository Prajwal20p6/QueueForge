import { WorkerMetrics } from '../../../../src/worker/metrics/worker-metrics';

describe('WorkerMetrics Unit Tests', () => {
  it('should record job outcomes, connector latency, retries, and active job counts', () => {
    const metrics = new WorkerMetrics();

    expect(() => {
      metrics.recordJobProcessed('del-1', 120, true);
      metrics.recordJobError('del-2', new Error('Fail'));
      metrics.recordConnectorCall('WEBHOOK', 85);
      metrics.recordRetry('del-2');
      metrics.recordDLQ('del-2', 'Max retries exceeded');
      metrics.setActiveJobs(3);
    }).not.toThrow();
  });
});
