import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { ResultRepository } from './result-repository';
import { DeliveryRepository } from './delivery-repository';
import { DestinationRepository } from './destination-repository';
import { AttemptRepository } from './attempt-repository';
import { IdempotencyCacheRepository } from './idempotency-cache-repository';
import { AuditLogRepository } from './audit-log-repository';
import { RepositoryFactory } from './repository-factory';

export * from './base-repository';
export * from './result-repository';
export * from './delivery-repository';
export * from './destination-repository';
export * from './attempt-repository';
export * from './idempotency-cache-repository';
export * from './audit-log-repository';
export * from './repository-factory';

export interface Repositories {
  results: ResultRepository;
  deliveries: DeliveryRepository;
  destinations: DestinationRepository;
  attempts: AttemptRepository;
  idempotencyCache: IdempotencyCacheRepository;
  auditLogs: AuditLogRepository;
}

export let repositories: Repositories;

/**
 * Initializes the global singleton repositories mapping using the new RepositoryFactory.
 */
export async function initializeRepositories(
  prisma: PrismaClient,
  logger: Logger
): Promise<Repositories> {
  const factory = new RepositoryFactory(prisma, logger);
  repositories = {
    results: factory.getResultRepository(),
    deliveries: factory.getDeliveryRepository(),
    destinations: factory.getDestinationRepository(),
    attempts: factory.getAttemptRepository(),
    idempotencyCache: factory.getIdempotencyCacheRepository(),
    auditLogs: factory.getAuditLogRepository(),
  };
  return repositories;
}

/**
 * Accesses the global repositories singleton.
 */
export function getRepositories(): Repositories {
  if (!repositories) {
    throw new Error('Repositories have not been initialized. Call initializeRepositories() first.');
  }
  return repositories;
}
