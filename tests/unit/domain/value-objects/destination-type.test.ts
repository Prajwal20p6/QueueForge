import {
  DestinationType,
  isWebhook,
  isDatabase,
  isQueue,
  isAudit,
} from '../../../../src/domain/value-objects/destination-type';

describe('DestinationType Value Object Unit Tests', () => {
  it('should construct correct structures via static factories', () => {
    expect(DestinationType.webhook()).toEqual({ kind: 'webhook' });
    expect(DestinationType.database()).toEqual({ kind: 'database' });
    expect(DestinationType.queue()).toEqual({ kind: 'queue' });
    expect(DestinationType.audit()).toEqual({ kind: 'audit' });
  });

  it('should narrow types correctly using destination guards', () => {
    const webhook = DestinationType.webhook();
    expect(isWebhook(webhook)).toBe(true);
    expect(isDatabase(webhook)).toBe(false);

    const database = DestinationType.database();
    expect(isDatabase(database)).toBe(true);
    expect(isQueue(database)).toBe(false);

    const queue = DestinationType.queue();
    expect(isQueue(queue)).toBe(true);
    expect(isAudit(queue)).toBe(false);

    const audit = DestinationType.audit();
    expect(isAudit(audit)).toBe(true);
  });
});
