import { generateUUID } from '../../src/shared/utils/crypto';

export class AuditLogFixtures {
  public static deliveryCreatedEvent() {
    return {
      id: generateUUID(),
      eventType: 'DELIVERY_CREATED',
      entityType: 'Delivery',
      entityId: generateUUID(),
      action: 'CREATE',
      changes: { before: null, after: { status: 'PENDING' } },
      createdAt: new Date(),
    };
  }
}
