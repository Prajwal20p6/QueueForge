import { AuditLogger } from '../../../../src/observability/audit/audit-logger';

describe('AuditLogger Unit Tests', () => {
  let auditLogger: AuditLogger;
  let logger: any;
  let repository: any;
  let metrics: any;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    repository = {
      log: jest.fn(),
    };
    metrics = {
      getMeter: jest.fn().mockReturnValue({
        createCounter: jest.fn().mockReturnValue({
          add: jest.fn(),
        }),
      }),
    };

    auditLogger = new AuditLogger(logger, repository, metrics);
  });

  it('should format and forward business logs to repository', async () => {
    await auditLogger.logEvent('ENTITY_CREATED', 'AiTaskResult', 'res-101', 'create', { key: 'val' });

    expect(logger.info).toHaveBeenCalled();
    expect(repository.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'ENTITY_CREATED',
        entityType: 'AiTaskResult',
        entityId: 'res-101',
        action: 'create',
      })
    );
  });

  it('should log session auth success/failure attempts', async () => {
    await auditLogger.logAuthAttempt(true, { userId: 'user-77', method: 'jwt' });

    expect(repository.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'AUTH_SUCCESS',
        action: 'login_success',
      })
    );
  });

  it('should log warnings and escalate security violations events', async () => {
    await auditLogger.logSecurityEvent('RATE_LIMIT_VIOLATED', 'MEDIUM', { actorId: 'client-88' });

    expect(logger.warn).toHaveBeenCalled();
    expect(repository.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'RATE_LIMIT_VIOLATED',
      })
    );
  });
});
