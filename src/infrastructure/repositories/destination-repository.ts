import { PrismaClient, Prisma, Destination, DestinationType } from '@prisma/client';
import { Logger } from 'winston';
import { BaseRepository, AuditContext } from './base-repository';
import { NotFoundError } from '../../shared/errors/not-found-error';
import { ValidationError } from '../../shared/errors/validation-error';

export interface DestinationStats {
  totalDeliveries: number;
  completedDeliveries: number;
  failedDeliveries: number;
  successRate: number;
  averageLatencyMs: number;
}

/**
 * DestinationRepository manages endpoint routing registration records, schema validations,
 * event filter selectors, and health statuses.
 */
export class DestinationRepository extends BaseRepository<Destination, Prisma.DestinationCreateInput, Prisma.DestinationUpdateInput> {
  constructor(prisma: PrismaClient, logger: Logger) {
    super(prisma, logger, 'destination');
  }

  // --- Implement BaseRepository Abstract Methods ---

  public async getAll(): Promise<Destination[]> {
    return this.findMany();
  }

  public async getById(id: string): Promise<Destination | null> {
    const record = await this.findUnique({ id });
    if (!record) {
      throw new NotFoundError(`Destination not found with id: ${id}`);
    }
    return record;
  }

  public async create(
    data: Prisma.DestinationCreateInput,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<Destination> {
    const { tx, auditCtx } = this.parseTxAndContext(txOrContext, context);
    this.validateEndpoint(data.destinationType, data.endpointUrl);
    return this.executeQuery(async () => {
      const client = tx || this.prisma;
      const created = await client.destination.create({ data });
      await this.logAudit(tx, 'DESTINATION_CREATED', created.id, 'CREATE', data, auditCtx);
      return created;
    });
  }

  public async update(
    id: string,
    data: Prisma.DestinationUpdateInput,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<Destination> {
    const { tx, auditCtx } = this.parseTxAndContext(txOrContext, context);
    if (data.destinationType && data.endpointUrl) {
      this.validateEndpoint(data.destinationType as DestinationType, data.endpointUrl as string);
    }
    return this.executeQuery(async () => {
      const client = tx || this.prisma;
      const updated = await client.destination.update({
        where: { id },
        data,
      });
      await this.logAudit(tx, 'DESTINATION_UPDATED', id, 'UPDATE', data, auditCtx);
      return updated;
    });
  }

  public async delete(
    id: string,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<Destination> {
    const { tx, auditCtx } = this.parseTxAndContext(txOrContext, context);
    return this.executeQuery(async () => {
      const client = tx || this.prisma;
      const deleted = await client.destination.delete({
        where: { id },
      });
      await this.logAudit(tx, 'DESTINATION_DELETED', id, 'DELETE', null, auditCtx);
      return deleted;
    });
  }

  public async findDestinationById(id: string, tx?: Prisma.TransactionClient): Promise<Destination | null> {
    return this.findById(id, tx);
  }

  // --- Specific Repository Methods ---

  public async createDestination(
    data: Prisma.DestinationCreateInput,
    txOrContext?: Prisma.TransactionClient | AuditContext,
    context?: AuditContext
  ): Promise<Destination> {
    if (data.destinationType === 'WEBHOOK' || data.destinationType === 'AUDIT') {
      if (data.endpointUrl && !data.endpointUrl.startsWith('http://') && !data.endpointUrl.startsWith('https://')) {
        throw new ValidationError('Endpoint URL must use HTTP or HTTPS scheme');
      }
    }
    return this.create(data, txOrContext, context);
  }

  public async findDestinationsByEventFilter(filters: any): Promise<Destination[]> {
    return this.findMatching(filters);
  }

  /**
   * Queries destinations matching specific types.
   */
  public async findByType(type: DestinationType): Promise<Destination[]> {
    return this.findMany({ destinationType: type });
  }

  /**
   * Queries currently enabled routing destinations.
   */
  public async findEnabled(): Promise<Destination[]> {
    return this.findMany({ enabled: true });
  }

  /**
   * Queries routing destinations matching type and enabled flags.
   */
  public async findByTypeAndEnabled(type: DestinationType): Promise<Destination[]> {
    return this.findMany({ destinationType: type, enabled: true });
  }

  /**
   * Selects destinations whose filter properties match incoming event payload fields.
   */
  public async findMatching(filters: any): Promise<Destination[]> {
    const enabledDestinations = await this.findEnabled();
    return enabledDestinations.filter((dest) => {
      if (!dest.eventFilters) return true;
      const destFilters = dest.eventFilters as any;
      return Object.keys(filters).every((key) => {
        return destFilters[key] === filters[key];
      });
    });
  }

  /**
   * Toggles the active/disabled status state of a destination.
   */
  public async toggleEnabled(id: string, enabled: boolean): Promise<Destination> {
    return this.update(id, { enabled });
  }

  /**
   * Modifies the circuit breaker error threshold limit for an endpoint.
   */
  public async updateCircuitBreakerThreshold(id: string, threshold: number): Promise<Destination> {
    if (threshold < 1 || threshold > 100) {
      throw new ValidationError('Circuit breaker threshold must be between 1 and 100');
    }
    return this.update(id, { circuitBreakerThreshold: threshold });
  }

  /**
   * Summarizes total delivery counts, successes, failures, and latency averages for a destination.
   */
  public async getDestinationStats(id: string): Promise<DestinationStats> {
    return this.executeQuery(async () => {
      const deliveries = await this.prisma.taskResultDelivery.findMany({
        where: { destinationId: id },
        include: { attempts: true },
      });

      const total = deliveries.length;
      let completed = 0;
      let failed = 0;
      let totalLatency = 0;
      let attemptsCount = 0;

      deliveries.forEach((d) => {
        if (d.status === 'COMPLETED') completed++;
        if (d.status === 'FAILED_DLQ') failed++;
        d.attempts.forEach((att) => {
          totalLatency += att.responseTimeMs;
          attemptsCount++;
        });
      });

      return {
        totalDeliveries: total,
        completedDeliveries: completed,
        failedDeliveries: failed,
        successRate: total > 0 ? (completed / total) * 100 : 0,
        averageLatencyMs: attemptsCount > 0 ? totalLatency / attemptsCount : 0,
      };
    });
  }

  /**
   * Compiles totals of destinations grouped by their target type.
   */
  public async countByType(): Promise<Record<DestinationType, number>> {
    return this.executeQuery(async () => {
      const counts = await this.prisma.destination.groupBy({
        by: ['destinationType'],
        _count: {
          _all: true,
        },
      });

      const result: Record<DestinationType, number> = {
        WEBHOOK: 0,
        DATABASE: 0,
        QUEUE: 0,
        AUDIT: 0,
      };

      counts.forEach((c) => {
        result[c.destinationType] = c._count._all;
      });

      return result;
    });
  }

  /**
   * Validates endpoint URI structure based on destination types.
   */
  private validateEndpoint(type: DestinationType, endpoint: string): void {
    if (!endpoint || typeof endpoint !== 'string' || endpoint.trim() === '') {
      throw new ValidationError('Endpoint identifier must be a non-empty string');
    }
    
    if (type === DestinationType.WEBHOOK || type === DestinationType.AUDIT) {
      if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
        throw new ValidationError(`Endpoint URL for ${type} must use HTTP or HTTPS scheme`);
      }
    } else if (type === DestinationType.DATABASE) {
      const allowedSchemes = ['postgresql://', 'postgres://', 'mysql://', 'mongodb://', 'sqlite://'];
      if (!allowedSchemes.some((scheme) => endpoint.startsWith(scheme))) {
        throw new ValidationError('Database endpoint connection string must use a supported connection scheme');
      }
    } else if (type === DestinationType.QUEUE) {
      if (endpoint.includes(' ') || endpoint.length < 3) {
        throw new ValidationError('Queue identifier name must not contain spaces and be at least 3 characters');
      }
    }
  }
}
export { DestinationRepository as PrismaDestinationRepository };
