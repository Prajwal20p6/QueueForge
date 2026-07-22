import { getRateLimitThreshold, RateLimitConfig } from '../../../../src/security/rate-limit/thresholds';

describe('Rate Limit Thresholds Selector Unit Tests', () => {
  const mockConfig: RateLimitConfig = {
    defaultLimit: 100,
    defaultWindowSeconds: 60,
    perEndpointLimits: {
      '/ingest': 10,
    },
    perApiKeyLimits: {
      'key-vip': 1000,
    },
    perUserLimits: {
      'user-premium': 500,
    },
  };

  it('should return default limits when no overrides exist', () => {
    const limits = getRateLimitThreshold(mockConfig);
    expect(limits).toEqual({ limit: 100, windowSeconds: 60 });
  });

  it('should override with endpoint limit if matched', () => {
    const limits = getRateLimitThreshold(mockConfig, '/ingest', 'key-vip', 'user-premium');
    expect(limits.limit).toBe(10); // endpoint has highest priority
  });

  it('should override with user limit if endpoint mismatch but user matches', () => {
    const limits = getRateLimitThreshold(mockConfig, '/other', 'key-vip', 'user-premium');
    expect(limits.limit).toBe(500); // user priority > apiKey priority
  });

  it('should override with apiKey limit if endpoint and user mismatch but apiKey matches', () => {
    const limits = getRateLimitThreshold(mockConfig, '/other', 'key-vip');
    expect(limits.limit).toBe(1000);
  });
});
