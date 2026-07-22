import { getQueueConfig, QUEUE_MAIN, QUEUE_DELAYED, QUEUE_DLQ } from '../../../src/config/queue';
import { EnvConfig } from '../../../src/config/env';

describe('Config: queue.ts', () => {
  const baseMockEnv: Partial<EnvConfig> = {
    MAX_RETRIES: 4,
    BACKOFF_BASE_MS: 3000,
    STALE_JOB_TIMEOUT_MS: 40000,
  };

  it('should export correct queue constants names', () => {
    expect(QUEUE_MAIN).toBe('delivery-queue');
    expect(QUEUE_DELAYED).toBe('delivery-queue:delayed');
    expect(QUEUE_DLQ).toBe('delivery-queue:dlq');
  });

  it('should correctly configure BullMQ settings from valid env', () => {
    const config = getQueueConfig(baseMockEnv as EnvConfig);
    expect(config.name).toBe(QUEUE_MAIN);
    expect(config.settings.maxRetriesPerJob).toBe(4);
    expect(config.settings.stalledInterval).toBe(40000);
    expect(config.settings.defaultJobOptions.attempts).toBe(4);
    expect(config.settings.defaultJobOptions.backoff).toEqual({
      type: 'exponential',
      delay: 3000,
    });
  });

  it('should throw error for invalid retry count or invalid stale timeouts', () => {
    const badRetries = { ...baseMockEnv, MAX_RETRIES: 15 };
    expect(() => getQueueConfig(badRetries as EnvConfig)).toThrow(/MAX_RETRIES configuration/);

    const badBackoff = { ...baseMockEnv, BACKOFF_BASE_MS: 50 };
    expect(() => getQueueConfig(badBackoff as EnvConfig)).toThrow(/BACKOFF_BASE_MS configuration/);

    const badStale = { ...baseMockEnv, STALE_JOB_TIMEOUT_MS: -100 };
    expect(() => getQueueConfig(badStale as EnvConfig)).toThrow(/STALE_JOB_TIMEOUT_MS/);
  });

  it('should freeze the returned queue config object', () => {
    const config = getQueueConfig(baseMockEnv as EnvConfig);
    expect(Object.isFrozen(config)).toBe(true);
  });
});
