import { AggregateRoot } from '../../../../src/domain/types/aggregates';
import { DomainEvent } from '../../../../src/domain/types/events';

// Concrete subclass for verification
class MockAggregate extends AggregateRoot {
  constructor(id: string) {
    super(id);
  }
}

describe('AggregateRoot Abstract Class Unit Tests', () => {
  it('should construct aggregate properties correctly', () => {
    const agg = new MockAggregate('agg-123');

    expect(agg.getId()).toBe('agg-123');
    expect(agg.getCreatedAt()).toBeInstanceOf(Date);
    expect(agg.isDeleted()).toBe(false);
    expect(agg.getDomainEvents()).toEqual([]);
  });

  it('should support equals verification based on identity only', () => {
    const agg1 = new MockAggregate('same-id');
    const agg2 = new MockAggregate('same-id');
    const agg3 = new MockAggregate('other-id');

    expect(agg1.equals(agg2)).toBe(true);
    expect(agg1.equals(agg3)).toBe(false);
  });

  it('should manage domain events accumulator lifecycle', () => {
    const agg = new MockAggregate('agg-789');

    const event1: DomainEvent = {
      name: 'WorkerCrashedEvent',
      aggregateId: 'agg-789',
      timestamp: new Date(),
      workerId: 'worker-1',
      crashReason: 'OOM',
    };

    agg.addDomainEvent(event1);
    expect(agg.getDomainEvents()).toEqual([event1]);

    agg.clearDomainEvents();
    expect(agg.getDomainEvents()).toEqual([]);
  });

  it('should support audit context metadata', () => {
    const agg = new MockAggregate('agg-555');
    agg.context = { actorId: 'admin-user', reason: 'manual override' };

    expect(agg.context.actorId).toBe('admin-user');
    expect(agg.context.reason).toBe('manual override');
  });

  it('should support soft-deletion', () => {
    const agg = new MockAggregate('agg-999');
    expect(agg.isDeleted()).toBe(false);

    agg.delete();
    expect(agg.isDeleted()).toBe(true);
  });
});
