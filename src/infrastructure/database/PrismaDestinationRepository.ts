import { IDestinationRepository } from '../../domain/repositories/IDestinationRepository';
import { Destination } from '../../domain/entities/destination.entity';
import { DestinationType } from '../../domain/value-objects/destination-type';
import { PrismaService } from './prisma.service';

/**
 * Adapter class mapping database records to Destination domain entities.
 */
export class PrismaDestinationRepository implements IDestinationRepository {
  private readonly prisma = PrismaService.getInstance();

  private toDomain(dbRecord: any): Destination {
    const type =
      dbRecord.destinationType === 'WEBHOOK'
        ? DestinationType.webhook()
        : dbRecord.destinationType === 'DATABASE'
          ? DestinationType.database()
          : dbRecord.destinationType === 'QUEUE'
            ? DestinationType.queue()
            : DestinationType.audit();

    return Destination.restore({
      id: dbRecord.id,
      endpointUrl: dbRecord.endpointUrl,
      destinationType: type,
      eventFilters: dbRecord.eventFilters as Record<string, any>,
      enabled: dbRecord.enabled,
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt,
      deletedAt: dbRecord.deletedAt,
    });
  }

  public async save(destination: Destination): Promise<Destination> {
    const dbType = destination.getDestinationType().kind.toUpperCase() as any;

    const record = await this.prisma.destination.upsert({
      where: { id: destination.getId() },
      update: {
        endpointUrl: destination.getEndpointUrl(),
        destinationType: dbType,
        eventFilters: destination.getEventFilters(),
        enabled: destination.isEnabled(),
        updatedAt: new Date(),
        deletedAt: destination.isDeleted() ? new Date() : null,
      },
      create: {
        id: destination.getId(),
        endpointUrl: destination.getEndpointUrl(),
        destinationType: dbType,
        eventFilters: destination.getEventFilters(),
        enabled: destination.isEnabled(),
        createdAt: destination.getCreatedAt(),
        updatedAt: new Date(),
        deletedAt: destination.isDeleted() ? new Date() : null,
      },
    });
    return this.toDomain(record);
  }

  public async findById(id: string): Promise<Destination | null> {
    const record = await this.prisma.destination.findUnique({
      where: { id },
    });
    return record ? this.toDomain(record) : null;
  }

  public async findAllActive(): Promise<Destination[]> {
    const records = await this.prisma.destination.findMany({
      where: { enabled: true, deletedAt: null },
    });
    return records.map((record: any) => this.toDomain(record));
  }

  public async findAll(): Promise<Destination[]> {
    const records = await this.prisma.destination.findMany({
      where: { deletedAt: null },
    });
    return records.map((record: any) => this.toDomain(record));
  }

  public async update(destination: Destination): Promise<Destination> {
    return this.save(destination);
  }
}
