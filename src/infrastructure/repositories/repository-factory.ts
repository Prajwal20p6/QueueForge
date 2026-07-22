import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { ResultRepository } from './result-repository';
import { DeliveryRepository } from './delivery-repository';
import { DestinationRepository } from './destination-repository';
import { AttemptRepository } from './attempt-repository';
import { IdempotencyCacheRepository } from './idempotency-cache-repository';
import { AuditLogRepository } from './audit-log-repository';
import { Repositories } from './index';

/**
 * RepositoryFactory instantiates and manages database repositories lazily as singletons
 * scoped to this factory instance.
 */
export class RepositoryFactory {
  private resultRepository: ResultRepository | null = null;
  private deliveryRepository: DeliveryRepository | null = null;
  private destinationRepository: DestinationRepository | null = null;
  private attemptRepository: AttemptRepository | null = null;
  private idempotencyCacheRepository: IdempotencyCacheRepository | null = null;
  private auditLogRepository: AuditLogRepository | null = null;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger
  ) {}

  /**
   * Static creator mapping expected by integration tests.
   */
  public static create(prisma: PrismaClient, logger: Logger): Repositories {
    const factory = new RepositoryFactory(prisma, logger);
    return {
      results: factory.getResultRepository(),
      deliveries: factory.getDeliveryRepository(),
      destinations: factory.getDestinationRepository(),
      attempts: factory.getAttemptRepository(),
      idempotencyCache: factory.getIdempotencyCacheRepository(),
      auditLogs: factory.getAuditLogRepository(),
    };
  }

  /**
   * Lazily loads and returns the ResultRepository instance.
   */
  public getResultRepository(): ResultRepository {
    if (!this.resultRepository) {
      this.resultRepository = new ResultRepository(this.prisma, this.logger);
    }
    return this.resultRepository;
  }

  /**
   * Lazily loads and returns the DeliveryRepository instance.
   */
  public getDeliveryRepository(): DeliveryRepository {
    if (!this.deliveryRepository) {
      this.deliveryRepository = new DeliveryRepository(this.prisma, this.logger);
    }
    return this.deliveryRepository;
  }

  /**
   * Lazily loads and returns the DestinationRepository instance.
   */
  public getDestinationRepository(): DestinationRepository {
    if (!this.destinationRepository) {
      this.destinationRepository = new DestinationRepository(this.prisma, this.logger);
    }
    return this.destinationRepository;
  }

  /**
   * Lazily loads and returns the AttemptRepository instance.
   */
  public getAttemptRepository(): AttemptRepository {
    if (!this.attemptRepository) {
      this.attemptRepository = new AttemptRepository(this.prisma, this.logger);
    }
    return this.attemptRepository;
  }

  /**
   * Lazily loads and returns the IdempotencyCacheRepository instance.
   */
  public getIdempotencyCacheRepository(): IdempotencyCacheRepository {
    if (!this.idempotencyCacheRepository) {
      this.idempotencyCacheRepository = new IdempotencyCacheRepository(this.prisma, this.logger);
    }
    return this.idempotencyCacheRepository;
  }

  /**
   * Lazily loads and returns the AuditLogRepository instance.
   */
  public getAuditLogRepository(): AuditLogRepository {
    if (!this.auditLogRepository) {
      this.auditLogRepository = new AuditLogRepository(this.prisma, this.logger);
    }
    return this.auditLogRepository;
  }
}
