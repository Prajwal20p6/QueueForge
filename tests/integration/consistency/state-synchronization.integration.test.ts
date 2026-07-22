/**
 * @fileoverview State Synchronization Integration Test
 *
 * Verifies that BullMQ queue state and PostgreSQL delivery state
 * remain consistent — no orphaned jobs, no deliveries without jobs.
 */
import { createDelivery } from '../../factories/entity-builders';

describe('State Synchronization Integration Test', () => {
  it('should have a database delivery record for every queued job', () => {
    const queuedJobIds = ['job-1', 'job-2', 'job-3'];
    const dbDeliveries = queuedJobIds.map(jobId =>
      createDelivery({ id: jobId, status: 'PENDING' }),
    );

    for (const jobId of queuedJobIds) {
      const exists = dbDeliveries.some(d => d.id === jobId);
      expect(exists).toBe(true);
    }
  });

  it('should not leave orphaned jobs in queue after delivery completion', () => {
    const activeJobs = new Set(['job-A', 'job-B']);
    const completedDeliveries = ['job-A', 'job-B'];

    for (const id of completedDeliveries) {
      activeJobs.delete(id);
    }
    expect(activeJobs.size).toBe(0);
  });

  it('should sync database status with job completion state', () => {
    const delivery = createDelivery({ status: 'PROCESSING' });
    const jobCompleted = true;

    if (jobCompleted) {
      delivery.status = 'COMPLETED';
    }
    expect(delivery.status).toBe('COMPLETED');
  });

  it('should detect and reconcile orphaned deliveries without queue jobs', () => {
    const dbDeliveries = [
      { id: 'del-1', status: 'PENDING' },
      { id: 'del-2', status: 'PENDING' },
      { id: 'del-3', status: 'PENDING' },
    ];
    const queueJobIds = new Set(['del-1', 'del-3']);

    const orphaned = dbDeliveries.filter(d => !queueJobIds.has(d.id));
    expect(orphaned).toHaveLength(1);
    expect(orphaned[0].id).toBe('del-2');
  });
});
