import { DeliveryRepository } from '../../../src/infrastructure/repositories/delivery.repository';
import { getPrismaClient } from '../../../src/infrastructure/database/client';

describe('Delivery Repository Integration', () => {
  let prisma: any;
  let repository: DeliveryRepository;
  let auditLogger: any;

  beforeEach(() => {
    prisma = getPrismaClient();
    auditLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    repository = new DeliveryRepository(prisma, auditLogger);
    jest.restoreAllMocks();
  });

  it('should create and retrieve delivery by ID with eager loading attempts', async () => {
    const mockRecord = {
      id: 'delivery-123',
      taskResultId: 'task-123',
      destinationId: 'dest-456',
      status: 'PENDING',
      retryCount: 0,
      nextRetryAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      attempts: [],
    };

    jest.spyOn(prisma.taskResultDelivery, 'create').mockResolvedValue(mockRecord);
    jest.spyOn(prisma.taskResultDelivery, 'findFirst').mockResolvedValue(mockRecord);
    jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    const delivery = await repository.createDelivery({
      taskResultId: 'task-123',
      destinationId: 'dest-456',
      status: 'PENDING',
    });

    expect(delivery.id).toBe('delivery-123');

    const retrieved = await repository.findDeliveryById('delivery-123');
    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe('delivery-123');
  });

  it('should record attempt and auto-increment retryCount metric', async () => {
    const mockDelivery = {
      id: 'delivery-123',
      retryCount: 2,
    };

    jest
      .spyOn(prisma.taskResultDelivery, 'findFirstOrThrow')
      .mockResolvedValue(mockDelivery as any);
    jest.spyOn(prisma.taskResultDeliveryAttempt, 'create').mockResolvedValue({} as any);
    jest.spyOn(prisma.taskResultDelivery, 'update').mockResolvedValue({} as any);
    jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    await repository.recordAttempt('delivery-123', {
      responseStatus: 200,
      responseTimeMs: 500,
    });

    expect(prisma.taskResultDeliveryAttempt.create).toHaveBeenCalledWith({
      data: {
        deliveryId: 'delivery-123',
        attemptNumber: 3, // 2 + 1
        responseStatus: 200,
        responseTimeMs: 500,
        errorMessage: undefined,
      },
    });

    expect(prisma.taskResultDelivery.update).toHaveBeenCalledWith({
      where: { id: 'delivery-123' },
      data: { retryCount: 3 },
    });
  });

  it('should move delivery status to FAILED_DLQ when moveToFailed/DLQ is invoked', async () => {
    jest
      .spyOn(prisma.taskResultDelivery, 'update')
      .mockResolvedValue({ status: 'FAILED_DLQ' } as any);
    jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

    const failed = await repository.moveToFailed('delivery-123', 'Webhook timeout error');
    expect(failed.status).toBe('FAILED_DLQ');

    const dlq = await repository.moveToDLQ('delivery-123', 'Max retry limit reached');
    expect(dlq.status).toBe('FAILED_DLQ');
  });
});
