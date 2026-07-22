import { BulkheadManager } from '../../../../src/resilience/bulkhead/bulkhead-manager';

describe('BulkheadManager Unit Tests', () => {
  let manager: BulkheadManager;

  beforeEach(() => {
    manager = new BulkheadManager();
  });

  it('should initialize preset destination bulkheads (WEBHOOK, DATABASE, QUEUE, AUDIT)', () => {
    const bulkheads = manager.getAll();
    const names = bulkheads.map(b => b.name);

    expect(names).toContain('WEBHOOK');
    expect(names).toContain('DATABASE');
    expect(names).toContain('QUEUE');
    expect(names).toContain('AUDIT');
  });

  it('should acquire and release slots through manager helper methods', async () => {
    await manager.acquire('WEBHOOK', 1000);
    const stats = manager.getStats().get('WEBHOOK');
    expect(stats?.active).toBe(1);

    manager.release('WEBHOOK');
    const statsAfter = manager.getStats().get('WEBHOOK');
    expect(statsAfter?.active).toBe(0);
  });
});
