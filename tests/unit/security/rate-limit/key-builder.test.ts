import { buildRateLimitKey } from '../../../../src/security/rate-limit/key-builder';

describe('Rate Limit Key Builder Unit Tests', () => {
  it('should generate standard global key when parameters are missing', () => {
    const key = buildRateLimitKey();
    expect(key).toBe('rate_limit:global:system:global');
  });

  it('should generate key scoped to user and endpoint', () => {
    const key = buildRateLimitKey(undefined, '/api/v1/jobs', 'user-123');
    expect(key).toBe('rate_limit:user:user-123:_api_v1_jobs');
  });

  it('should generate key scoped to apiKey and endpoint', () => {
    const key = buildRateLimitKey('apikey-xyz-789', '/api/v1/jobs');
    expect(key).toBe('rate_limit:apikey:apikey-xyz-789:_api_v1_jobs');
  });

  it('should hash long identifiers in the generated key', () => {
    const longId = 'a'.repeat(50);
    const key = buildRateLimitKey(longId);

    expect(key.length).toBeLessThan(100);
    expect(key.includes(longId)).toBe(false);
  });
});
