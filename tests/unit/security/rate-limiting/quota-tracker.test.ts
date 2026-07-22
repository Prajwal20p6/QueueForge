import { QuotaTracker } from '../../../../src/security/rate-limiting/quota-tracker';
import { QuotaDefinition } from '../../../../src/security/rate-limiting/quota-definitions';

describe('QuotaTracker Unit Tests', () => {
  it('should track and enforce quota limits', async () => {
    const mockStore = new Map<string, string>();
    const mockRedis = {
      get: async (k: string) => mockStore.get(k) ?? null,
      setex: async (k: string, _ttl: number, v: string) => {
        mockStore.set(k, v);
        return 'OK';
      },
    } as any;

    const definitions: QuotaDefinition[] = [
      { name: 'results_ingestion', limit: 2, window: '1m', scope: 'per_api_key' },
    ];

    const tracker = new QuotaTracker(mockRedis, definitions);
    const check1 = await tracker.checkQuota('key-123', 'results_ingestion');
    expect(check1.allowed).toBe(true);
    expect(check1.remaining).toBe(2);

    await tracker.updateUsage('key-123', 'results_ingestion', 2);
    const check2 = await tracker.checkQuota('key-123', 'results_ingestion');
    expect(check2.allowed).toBe(false);
  });
});
