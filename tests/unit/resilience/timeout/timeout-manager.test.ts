import { TimeoutManager } from '../../../../src/resilience/timeout/timeout-manager';

describe('TimeoutManager Unit Tests', () => {
  let manager: TimeoutManager;

  beforeEach(() => {
    manager = new TimeoutManager();
  });

  it('should return default timeouts for standard operation categories (http, database, redis, queue)', () => {
    expect(manager.getTimeout('http')).toBe(30000);
    expect(manager.getTimeout('database')).toBe(60000);
    expect(manager.getTimeout('redis')).toBe(10000);
    expect(manager.getTimeout('queue')).toBe(30000);
  });

  it('should support updating custom timeout settings', () => {
    manager.setCustomTimeout('http', 45000);
    expect(manager.getTimeout('http')).toBe(45000);
  });
});
