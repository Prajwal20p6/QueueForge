import { loadWorkerConfig } from '../../../src/config/worker.config';

describe('Config: worker.config.ts', () => {
  it('should successfully build WorkerConfig', () => {
    const config = loadWorkerConfig();
    expect(config.enabled).toBe(true);
    expect(config.concurrency).toBe(10);
    expect(config.pollIntervalMs).toBe(1000);
    expect(config.maxInFlightJobs).toBe(1000);
  });
});
