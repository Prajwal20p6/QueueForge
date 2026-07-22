import { AuditEvent } from './audit-event';
import { DatabaseAuditStorage } from './audit-storage';
import { generateUUID } from '../../shared/utils/crypto';

/**
 * AuditLogger orchestrates immutable database logging and security audit reporting operations.
 */
export class AuditLogger {
  private readonly storage: any;
  private readonly logger?: any;

  constructor(...args: any[]) {
    if (args[0] && (typeof args[0].store === 'function' || typeof args[0].query === 'function')) {
      // (auditStorage, logger)
      this.storage = args[0];
      this.logger = args[1];
    } else if (args[1] && (typeof args[1].log === 'function' || typeof args[1].store === 'function')) {
      // (logger, auditRepository, metricsRegistry)
      this.logger = args[0];
      this.storage = args[1];
    } else {
      this.logger = args[0];
      this.storage = new DatabaseAuditStorage();
    }
  }

  /**
   * Logs a generic AuditEvent instance.
   */
  public async log(event: AuditEvent): Promise<void> {
    try {
      if (!event.id) {
        event.id = generateUUID();
      }
      if (!event.timestamp) {
        event.timestamp = new Date();
      }
      this.logger?.info?.(`[AuditLogger] Event: ${event.eventType} on ${event.entityType}:${event.entityId}`);

      if (this.storage) {
        if (typeof this.storage.log === 'function') {
          await this.storage.log(event);
        } else if (typeof this.storage.store === 'function') {
          await this.storage.store(event);
        }
      }
    } catch (err: any) {
      this.logger?.error?.(`[AuditLogger] Failed to write audit event "${event.eventType}": ${err.message}`);
    }
  }

  public async logDeliveryCreated(deliveryId: string, resultId: string, destinationId: string, userId?: string): Promise<void> {
    await this.log({
      id: generateUUID(),
      timestamp: new Date(),
      eventType: 'DELIVERY_CREATED',
      entityType: 'Delivery',
      entityId: deliveryId,
      action: 'CREATE',
      userId,
      changes: { before: null, after: { resultId, destinationId } },
      success: true,
    });
  }

  public async logDeliveryStatusChanged(deliveryId: string, from: any, to: any, userId?: string): Promise<void> {
    await this.log({
      id: generateUUID(),
      timestamp: new Date(),
      eventType: 'DELIVERY_STATUS_CHANGED',
      entityType: 'Delivery',
      entityId: deliveryId,
      action: 'UPDATE',
      userId,
      changes: { before: { status: from }, after: { status: to } },
      success: true,
    });
  }

  public async logDestinationCreated(destinationId: string, type: any, endpoint: string, userId: string): Promise<void> {
    await this.log({
      id: generateUUID(),
      timestamp: new Date(),
      eventType: 'DESTINATION_CREATED',
      entityType: 'Destination',
      entityId: destinationId,
      action: 'CREATE',
      userId,
      changes: { before: null, after: { type, endpoint } },
      success: true,
    });
  }

  public async logDestinationUpdated(destinationId: string, changes: any, userId: string): Promise<void> {
    await this.log({
      id: generateUUID(),
      timestamp: new Date(),
      eventType: 'DESTINATION_UPDATED',
      entityType: 'Destination',
      entityId: destinationId,
      action: 'UPDATE',
      userId,
      changes,
      success: true,
    });
  }

  public async logApiKeyCreated(keyId: string, tier: string, userId: string): Promise<void> {
    await this.log({
      id: generateUUID(),
      timestamp: new Date(),
      eventType: 'API_KEY_CREATED',
      entityType: 'ApiKey',
      entityId: keyId,
      action: 'CREATE',
      userId,
      changes: { before: null, after: { tier } },
      success: true,
    });
  }

  public async logApiKeyRevoked(keyId: string, userId: string): Promise<void> {
    await this.log({
      id: generateUUID(),
      timestamp: new Date(),
      eventType: 'API_KEY_REVOKED',
      entityType: 'ApiKey',
      entityId: keyId,
      action: 'UPDATE',
      userId,
      changes: { before: { revoked: false }, after: { revoked: true } },
      success: true,
    });
  }

  public async logAuthenticationFailed(reason: string, ipAddress?: string): Promise<void> {
    await this.log({
      id: generateUUID(),
      timestamp: new Date(),
      eventType: 'AUTH_FAILED',
      entityType: 'Authentication',
      entityId: 'auth',
      action: 'EXECUTE',
      ipAddress,
      success: false,
      error: reason,
    });
  }

  public async logAuthorizationDenied(resource: string, userId?: string, ipAddress?: string): Promise<void> {
    await this.log({
      id: generateUUID(),
      timestamp: new Date(),
      eventType: 'AUTHZ_DENIED',
      entityType: 'Authorization',
      entityId: resource,
      action: 'EXECUTE',
      userId,
      ipAddress,
      success: false,
      error: 'Permission denied',
    });
  }

  public async logAuthAttempt(success: boolean, context?: { userId?: string; method: string }): Promise<void> {
    await this.log({
      id: generateUUID(),
      timestamp: new Date(),
      eventType: success ? 'AUTH_SUCCESS' : 'AUTH_FAILURE',
      entityType: 'Authentication',
      entityId: context?.userId || 'auth',
      action: success ? 'login_success' : 'login_failure',
      userId: context?.userId,
      success,
    });
  }

  public async logSecurityEvent(eventType: string, severity: string, data?: any): Promise<void> {
    this.logger?.warn?.(`Security violation event: ${eventType} (severity: ${severity})`);
    await this.log({
      id: generateUUID(),
      timestamp: new Date(),
      eventType,
      entityType: 'Security',
      entityId: severity,
      action: 'EXECUTE',
      changes: data,
      success: true,
    });
  }

  /**
   * Backward-compatible logEvent method.
   */
  public async logEvent(
    eventType: string,
    entityType: string,
    entityId: string | null,
    action: string,
    changes: any,
    context?: any
  ): Promise<void> {
    await this.log({
      id: generateUUID(),
      timestamp: new Date(),
      eventType,
      entityType,
      entityId: entityId || 'none',
      action: action || 'EXECUTE',
      userId: context?.actorId,
      changes,
      success: true,
    });
  }
}
