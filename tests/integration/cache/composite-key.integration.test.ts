import {
  buildIdempotencyKey,
  isValidIdempotencyKey,
} from '../../../src/infrastructure/cache/composite-key';

describe('Composite Idempotency Key Integration', () => {
  it('should generate deterministic composite key matching target specifications', () => {
    const taskResultId = 'c7a8b9c0-1234-5678-90ab-cdef12345678';
    const destinationId = 'd1e2f3a4-5678-90ab-cdef-1234567890ab';

    const key = buildIdempotencyKey(taskResultId, destinationId);

    // Format check
    expect(key).toContain(':');
    const [prefix, fullHash] = key.split(':');

    expect(prefix.length).toBe(16);
    expect(fullHash.length).toBe(64);
    expect(fullHash.startsWith(prefix)).toBe(true);

    // Deterministic check
    const duplicateKey = buildIdempotencyKey(taskResultId, destinationId);
    expect(duplicateKey).toBe(key);
  });

  it('should evaluate valid and invalid composite keys accurately', () => {
    const validKey = buildIdempotencyKey('task-123', 'dest-456');
    expect(isValidIdempotencyKey(validKey)).toBe(true);

    expect(isValidIdempotencyKey('shortprefix:hashvalue')).toBe(false);
    expect(
      isValidIdempotencyKey(
        'invalidprefix:4a96b488730999017bb143c7b6f68c34f3eb4873130d22c9bbcd92039abfe000'
      )
    ).toBe(false);
    expect(isValidIdempotencyKey('')).toBe(false);
  });
});
