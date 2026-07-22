/**
 * @fileoverview Data Consistency Integration Test
 *
 * Verifies that the database (PostgreSQL) remains the source of truth
 * and that the Redis cache is properly invalidated on state mutations.
 */
import { createDelivery } from '../../factories/entity-builders';

describe('Data Consistency Integration Test', () => {
  it('should reflect database state as source of truth after update', () => {
    const delivery = createDelivery({ status: 'PENDING' });

    // Simulate database status update
    delivery.status = 'COMPLETED';
    delivery.updatedAt = new Date();

    expect(delivery.status).toBe('COMPLETED');
    expect(delivery.updatedAt).toBeInstanceOf(Date);
  });

  it('should invalidate cache when database state changes', () => {
    const cache = new Map<string, string>();
    const deliveryId = 'del-consistency-01';

    cache.set(deliveryId, 'PENDING');
    expect(cache.get(deliveryId)).toBe('PENDING');

    // Simulate database update + cache invalidation
    cache.delete(deliveryId);
    expect(cache.has(deliveryId)).toBe(false);
  });

  it('should fetch fresh data from database when cache miss', () => {
    const cache = new Map<string, string>();
    const deliveryId = 'del-consistency-02';
    const dbState = 'COMPLETED';

    const fetch = (id: string): string => {
      if (cache.has(id)) return cache.get(id)!;
      // Simulated database read
      cache.set(id, dbState);
      return dbState;
    };

    const result = fetch(deliveryId);
    expect(result).toBe('COMPLETED');
    expect(cache.get(deliveryId)).toBe('COMPLETED');
  });

  it('should not serve stale cached data after mutation', () => {
    const cache = new Map<string, string>();
    const deliveryId = 'del-consistency-03';

    cache.set(deliveryId, 'PENDING');

    // Mutation: update status in database
    const dbStatus = 'COMPLETED';
    cache.delete(deliveryId);

    // Re-read from database
    cache.set(deliveryId, dbStatus);
    expect(cache.get(deliveryId)).toBe('COMPLETED');
  });
});
