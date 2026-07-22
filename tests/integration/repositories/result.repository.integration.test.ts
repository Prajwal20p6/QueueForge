import { ResultRepository } from '../../../src/infrastructure/repositories/result.repository';
import { getPrismaClient } from '../../../src/infrastructure/database/client';

describe('Result Repository Integration', () => {
  let prisma: any;
  let repository: ResultRepository;
  let auditLogger: any;

  beforeEach(() => {
    prisma = getPrismaClient();
    auditLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    repository = new ResultRepository(prisma, auditLogger);
    jest.restoreAllMocks();
  });

  it('should create and retrieve results with correct format checks', async () => {
    const mockRecord = {
      id: 'result-123',
      emailId: 'test-user@oneinbox.com',
      agentId: 'classifier-agent',
      agentVersion: '1.0.0',
      resultPayload: { category: 'urgent' },
      confidenceScore: 0.95,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    jest.spyOn(prisma.aiTaskResult, 'create').mockResolvedValue(mockRecord);
    jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    const record = await repository.createResult({
      emailId: 'test-user@oneinbox.com',
      agentId: 'classifier-agent',
      agentVersion: '1.0.0',
      resultPayload: { category: 'urgent' },
      confidenceScore: 0.95,
    });

    expect(record.id).toBe('result-123');
    expect(prisma.aiTaskResult.create).toHaveBeenCalled();
  });

  it('should throw error when creating result with invalid email format', async () => {
    await expect(
      repository.createResult({
        emailId: 'invalid-email',
        agentId: 'classifier-agent',
        agentVersion: '1.0.0',
        resultPayload: {},
        confidenceScore: 0.8,
      })
    ).rejects.toThrow(/Invalid email format/);
  });

  it('should fetch pending results correctly', async () => {
    jest.spyOn(prisma.aiTaskResult, 'findMany').mockResolvedValue([{ id: 'pending-1' }]);

    const pending = await repository.findPendingResults(10);
    expect(pending.length).toBe(1);
    expect(prisma.aiTaskResult.findMany).toHaveBeenCalled();
  });

  it('should return aggregated metrics statistics successfully', async () => {
    const mockRecords = [
      { agentId: 'agent-1', emailId: 'user1@test.com', confidenceScore: 0.8 },
      { agentId: 'agent-1', emailId: 'user2@test.com', confidenceScore: 0.9 },
    ];
    jest.spyOn(prisma.aiTaskResult, 'findMany').mockResolvedValue(mockRecords as any);

    const stats = await repository.getResultStats();
    expect(stats.total).toBe(2);
    expect(stats.averageConfidence).toBeCloseTo(0.85);
    expect(stats.byAgent['agent-1']).toBe(2);
  });
});
