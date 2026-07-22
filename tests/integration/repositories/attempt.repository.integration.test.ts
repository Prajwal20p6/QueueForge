import { AttemptRepository } from '../../../src/infrastructure/repositories/attempt.repository';
import { getPrismaClient } from '../../../src/infrastructure/database/client';

describe('Attempt Repository Integration', () => {
  let prisma: any;
  let repository: AttemptRepository;
  let auditLogger: any;

  beforeEach(() => {
    prisma = getPrismaClient();
    auditLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    repository = new AttemptRepository(prisma, auditLogger);
    jest.restoreAllMocks();
  });

  it('should log attempt and validate HTTP response status bounds', async () => {
    const mockRecord = {
      id: 'attempt-123',
      deliveryId: 'delivery-123',
      attemptNumber: 1,
      responseStatus: 200,
      responseTimeMs: 250,
      errorMessage: null,
      timestamp: new Date(),
    };

    jest.spyOn(prisma.taskResultDeliveryAttempt, 'create').mockResolvedValue(mockRecord);
    jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    const record = await repository.recordAttempt('delivery-123', 1, {
      responseStatus: 200,
      responseTimeMs: 250,
    });

    expect(record.id).toBe('attempt-123');
    expect(prisma.taskResultDeliveryAttempt.create).toHaveBeenCalled();
  });

  it('should throw error when responseStatus is out of HTTP bounds [100, 599]', async () => {
    await expect(
      repository.recordAttempt('delivery-123', 1, {
        responseStatus: 99,
        responseTimeMs: 100,
      })
    ).rejects.toThrow(/Invalid HTTP response status range/);

    await expect(
      repository.recordAttempt('delivery-123', 1, {
        responseStatus: 600,
        responseTimeMs: 100,
      })
    ).rejects.toThrow(/Invalid HTTP response status range/);
  });

  it('should return chronological attempt history sorted by timestamp DESC', async () => {
    const mockHistory = [
      { id: 'att-2', timestamp: new Date(Date.now() + 1000) },
      { id: 'att-1', timestamp: new Date() },
    ];
    jest.spyOn(prisma.taskResultDeliveryAttempt, 'findMany').mockResolvedValue(mockHistory as any);

    const history = await repository.getAttemptHistory('delivery-123', 5);
    expect(history.length).toBe(2);
    expect(prisma.taskResultDeliveryAttempt.findMany).toHaveBeenCalledWith({
      where: { deliveryId: 'delivery-123' },
      take: 5,
      orderBy: { timestamp: 'desc' },
    });
  });
});
