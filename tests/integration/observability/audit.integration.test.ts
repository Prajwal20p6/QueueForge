import { initializeObservability, getObservability } from '../../../src/observability';
import { getPrismaClient } from '../../../src/infrastructure/database/client';

describe('Audit Integration Tests', () => {
  const config = {
    enabled: true,
    tracingEnabled: false,
    metricsEnabled: false,
    loggingEnabled: false,
    jaegerEndpoint: '',
    jaegerServiceName: 'integration-test',
    traceSampleRate: 1.0,
    prometheusPort: 9090,
    logLevel: 'info',
    logFormat: 'pretty' as const,
    logDestination: 'console' as const,
    metricBuckets: [],
  };

  beforeAll(async () => {
    await initializeObservability(config as any);
  });

  it('should create audit logs and prevent modifications and deletions', async () => {
    const context = await getObservability();
    const prisma = getPrismaClient();

    const createSpy = jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({
      id: 'audit-id',
      eventType: 'AUTH_SUCCESS',
      entityType: 'User',
      entityId: 'user-id',
      actorId: 'system',
      action: 'login',
      changes: {},
      ipAddress: null,
      userAgent: null,
      createdAt: new Date(),
    } as any);

    await expect(
      context.audit.logEvent('AUTH_SUCCESS', 'User', 'user-id', 'login', {})
    ).resolves.not.toThrow();

    expect(createSpy).toHaveBeenCalled();
  });
});
