export type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE' | 'login_success' | 'login_failure' | (string & {});

/**
 * Interface representing a security/compliance Audit Event record.
 */
export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId?: string;
  apiKeyId?: string;
  changes?: { before: any; after: any };
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
}

export interface EventStats {
  totalEvents: number;
  byEventType: Record<string, number>;
  byAction: Record<string, number>;
  successCount: number;
  failureCount: number;
}
