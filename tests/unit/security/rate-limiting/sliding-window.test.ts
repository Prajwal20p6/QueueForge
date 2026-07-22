import { SlidingWindowCounter } from '../../../../src/security/rate-limiting/sliding-window';

describe('SlidingWindowCounter Unit Tests', () => {
  it('should increment sliding window hits count', async () => {
    const mockStore = new Map<string, string>();
    const mockRedis = {
      get: async (k: string) => mockStore.get(k) ?? null,
      setex: async (k: string, _ttl: number, v: string) => {
        mockStore.set(k, v);
        return 'OK';
      },
    } as any;

    const counter = new SlidingWindowCounter(mockRedis, 1000);
    const count = await counter.increment('test-key');
    expect(count).toBe(1);

    const count2 = await counter.increment('test-key');
    expect(count2).toBe(2);
  });
});
