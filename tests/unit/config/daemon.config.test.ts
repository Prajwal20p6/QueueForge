import { loadDaemonConfig } from '../../../src/config/daemon.config';

describe('Config: daemon.config.ts', () => {
  it('should successfully build DaemonConfig', () => {
    const config = loadDaemonConfig();
    expect(config.enabled).toBe(true);
    expect(config.recovery.intervalMs).toBe(60000);
    expect(config.health.intervalMs).toBe(30000);
  });
});
