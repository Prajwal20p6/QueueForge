import { IDeliveryLogRepository } from '../../domain/repositories/IDeliveryLogRepository';
import { Delivery } from '../../domain/entities/delivery.entity';
import { DeliveryStatus } from '../../domain/value-objects/delivery-status';
import { PrismaService } from './prisma.service';

/**
 * Adapter class mapping database records to Delivery domain entities.
 */
export class PrismaDeliveryLogRepository implements IDeliveryLogRepository {
  private readonly prisma = PrismaService.getInstance();

  private toDomain(dbRecord: any): Delivery {
    const statusVal = dbRecord.status.toLowerCase();
    const status =
      statusVal === 'pending'
        ? DeliveryStatus.pending()
        : statusVal === 'processing'
        ? DeliveryStatus.processing()
        : statusVal === 'completed'
        ? DeliveryStatus.completed()
        : statusVal === 'scheduled_retry'
        ? DeliveryStatus.scheduledRetry()
        : DeliveryStatus.failedDLQ();

    return Delivery.restore({
      id: dbRecord.id,
      taskResultId: dbRecord.taskResultId,
      destinationId: dbRecord.destinationId,
      status,
      retryCount: dbRecord.retryCount,
      nextRetryAt: dbRecord.nextRetryAt,
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt,
      deletedAt: dbRecord.deletedAt,
    });
  }

  public async save(log: Delivery): Promise<Delivery> {
    const dbStatus = log.getStatus().kind.toUpperCase() as any;

    const record = await this.prisma.taskResultDelivery.upsert({
      where: { id: log.getId() },
      update: {
        status: dbStatus,
        retryCount: log.getRetryCount(),
        nextRetryAt: log.getNextRetryAt(),
        updatedAt: new Date(),
      },
      create: {
        id: log.getId(),
        taskResultId: log.getTaskResultId(),
        destinationId: log.getDestinationId(),
        status: dbStatus,
        retryCount: log.getRetryCount(),
        nextRetryAt: log.getNextRetryAt(),
        createdAt: log.getCreatedAt(),
        updatedAt: new Date(),
      },
    });

    // Write attempts logs if events were recorded
    const events = log.getDomainEvents();
    for (const event of events) {
      if (event.name === 'DeliveryCompletedEvent') {
        await this.prisma.taskResultDeliveryAttempt.create({
          data: {
            deliveryId: log.getId(),
            attemptNumber: log.getRetryCount(),
            responseStatus: event.responseStatus,
            responseTimeMs: event.latencyMs,
          },
        });
      } else if (event.name === 'DeliveryFailedEvent') {
        await this.prisma.taskResultDeliveryAttempt.create({
          data: {
            deliveryId: log.getId(),
            attemptNumber: log.getRetryCount(),
            errorMessage: event.errorMessage,
          },
        });
      }
    }

    log.clearDomainEvents();
    return this.toDomain(record);
  }

  public async findByTaskResultId(taskResultId: string): Promise<Delivery[]> {
    const records = await this.prisma.taskResultDelivery.findMany({
      where: { taskResultId },
    });
    return records.map((record: any) => this.toDomain(record));
  }

  public async findByDestinationId(destinationId: string): Promise<Delivery[]> {
    const records = await this.prisma.taskResultDelivery.findMany({
      where: { destinationId },
    });
    return records.map((record: any) => this.toDomain(record));
  }

  public async findAll(): Promise<Delivery[]> {
    const records = await this.prisma.taskResultDelivery.findMany();
    return records.map((record: any) => this.toDomain(record));
  }

  public async findStale(staleThreshold: Date): Promise<Delivery[]> {
    const records = await this.prisma.taskResultDelivery.findMany({
      where: {
        status: 'PROCESSING',
        updatedAt: {
          lte: staleThreshold,
        },
      },
    });
    return records.map((record: any) => this.toDomain(record));
  }

  public async findByStatus(status: string): Promise<Delivery[]> {
    const records = await this.prisma.taskResultDelivery.findMany({
      where: {
        status: status.toUpperCase() as any,
      },
    });
    return records.map((record: any) => this.toDomain(record));
  }
}
