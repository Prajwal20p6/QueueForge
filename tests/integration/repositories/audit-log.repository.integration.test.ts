import { AuditLogRepository } from '../../../src/infrastructure/repositories/audit-log.repository';
import { getPrismaClient } from '../../../src/infrastructure/database/client';

describe('Audit Log Repository Integration', () => {
  let prisma: any;
  let repository: AuditLogRepository;
  let auditLogger: any;

  beforeEach(() => {
    prisma = getPrismaClient();
    auditLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    repository = new AuditLogRepository(prisma, auditLogger);
    jest.restoreAllMocks();
  });

  it('should block updates and deletes and throw descriptive errors', async () => {
    await expect(repository.update()).rejects.toThrow(
      /Audit logs are immutable and cannot be updated/
    );
    await expect(repository.delete()).rejects.toThrow(
      /Audit logs are immutable and cannot be deleted/
    );
  });

  it('should create and retrieve audit logs successfully', async () => {
    const mockRecord = {
      id: 'log-123',
      eventType: 'RESULT_CREATE',
      entityType: 'AiTaskResult',
      entityId: 'result-123',
      actorId: 'admin-user',
      action: 'create',
      changes: { emailId: 'test@user.com' },
      createdAt: new Date(),
    };

    jest.spyOn(prisma.auditLog, 'create').mockResolvedValue(mockRecord);

    const record = await repository.createAuditLog(
      'RESULT_CREATE',
      'AiTaskResult',
      'result-123',
      'admin-user',
      'create',
      { emailId: 'test@user.com' }
    );

    expect(record.id).toBe('log-123');
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });
});
