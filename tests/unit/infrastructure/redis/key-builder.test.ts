import { KeyBuilder } from '../../../../src/infrastructure/redis/key-builder';

describe('key-builder Unit Tests', () => {
  it('should generate consistent namespaced keys', () => {
    expect(KeyBuilder.heartbeat('w1')).toBe('queueforge:heartbeat:w1');
    expect(KeyBuilder.idempotencyCache('r1', 'd1')).toBe('queueforge:idempotency:r1:d1');
    expect(KeyBuilder.circuitBreaker('d1')).toBe('queueforge:cb:d1');
    expect(KeyBuilder.rateLimitCounter('api1', 'post')).toBe('queueforge:ratelimit:api1:post');
    expect(KeyBuilder.sessionData('s1')).toBe('queueforge:session:s1');
    expect(KeyBuilder.lockKey('lock1')).toBe('queueforge:lock:lock1');
    expect(KeyBuilder.metricsKey('m1')).toBe('queueforge:metrics:m1');
    expect(KeyBuilder.cacheKey('n1', 'id1')).toBe('queueforge:cache:n1:id1');
    expect(KeyBuilder.tempDataKey('t1', 100)).toBe('queueforge:temp:t1:100');
  });
});
