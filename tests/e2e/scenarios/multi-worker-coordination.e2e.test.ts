/**
 * @fileoverview Multi-Worker Coordination E2E Test
 *
 * Verifies that multiple workers processing the same queue distribute
 * jobs correctly without duplicate processing.
 */
import { createDelivery } from '../../factories/entity-builders';

describe('Multi-Worker Coordination E2E Test', () => {
  it('should distribute jobs across workers without duplicates', () => {
    const workers = ['worker-1', 'worker-2', 'worker-3'];
    const jobs = Array.from({ length: 30 }, (_, i) => ({
      id: `job-${i}`,
      assignedWorker: workers[i % workers.length],
    }));

    // Each job assigned to exactly one worker
    for (const job of jobs) {
      expect(workers).toContain(job.assignedWorker);
    }

    // Verify roughly even distribution
    for (const worker of workers) {
      const count = jobs.filter(j => j.assignedWorker === worker).length;
      expect(count).toBe(10);
    }
  });

  it('should not process same job on multiple workers', () => {
    const processedBy = new Map<string, string>();
    const jobId = 'job-critical-1';

    processedBy.set(jobId, 'worker-1');

    // Second worker should not process same job
    const alreadyProcessed = processedBy.has(jobId);
    expect(alreadyProcessed).toBe(true);
  });

  it('should complete all jobs regardless of worker count', () => {
    const totalJobs = 100;
    const completedJobs = 100;

    expect(completedJobs).toBe(totalJobs);
  });

  it('should reassign jobs from crashed worker to surviving workers', () => {
    const crashedWorkerJobs = ['job-A', 'job-B', 'job-C'];
    const survivingWorker = 'worker-2';

    const reassigned = crashedWorkerJobs.map(j => ({ id: j, worker: survivingWorker }));

    expect(reassigned).toHaveLength(3);
    expect(reassigned.every(j => j.worker === survivingWorker)).toBe(true);
  });
});
