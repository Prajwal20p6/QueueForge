import { TokenBucket } from '../../../../src/security/rate-limiting/token-bucket';

describe('TokenBucket Unit Tests', () => {
  it('should consume tokens within capacity bounds', async () => {
    const mockStore = new Map<string, string>();
    const mockRedis = {
      get: async (k: string) => mockStore.get(k) ?? null,
      setex: async (k: string, _ttl: number, v: string) => {
        mockStore.set(k, v);
        return 'OK';
      },
    } as any;

    const bucket = new TokenBucket(mockRedis, 5, 1, 1000);
    const consumed = await bucket.tryConsume('user-1', 3);
    expect(consumed).toBe(true);

    const consumed2 = await bucket.tryConsume('user-1', 3); // Available 2, needs 3, but refilled to min(5, 2 + 1) = 3
    expect(consumed2).toBe(true);

    const consumed3 = await bucket.tryConsume('user-1', 3); // Available 0, needs 3, refilled to min(5, 0 + 1) = 1 (fails!)
    expect(consumed3).toBe(false);
  });
});
