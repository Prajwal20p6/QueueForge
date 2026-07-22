import express from 'express';
import { Config } from '../config';
import { Logger } from '../observability/logging/logger';
import { DependencyContainer } from './types';
import { createApp } from '../api/app';

import { ResultController } from '../api/controllers/result.controller';
import { LineageController } from '../api/controllers/lineage.controller';
import { DestinationController } from '../api/controllers/destination.controller';
import { DeliveryController } from '../api/controllers/delivery.controller';
import { HealthController } from '../api/controllers/health.controller';
import { DashboardController } from '../api/controllers/dashboard.controller';

import { DependencyChecker } from '../daemon/health/dependency-checker';

/**
 * Initializes controllers, registers middlewares, mounts routes, and creates the Express Application.
 *
 * @param config - The application unified configuration object.
 * @param dependencies - The instantiated DependencyContainer.
 * @param logger - The application logger.
 * @returns Configured express Application.
 */
export async function setupApi(
  _config: Config,
  dependencies: DependencyContainer,
  logger: Logger
): Promise<express.Application> {
  logger.info('[ApiSetup] Configuring Express REST controllers and endpoints...');

  try {
    const prisma = dependencies.getPrisma();
    const redis = dependencies.getRedis();
    const queueManager = dependencies.getQueueManager();
    const queue = queueManager.getMainQueue();
    const observability = dependencies.getObservability();
    const security = dependencies.getSecurity();
    const repositories = (dependencies as any).getRepositories();
    const services = (dependencies as any).getServices();

    // 1. Instantiate Controllers
    const resultController = new ResultController(
      services.ingestResult,
      repositories.results,
      logger as any,
      observability
    );

    const lineageController = new LineageController(
      repositories.results,
      repositories.deliveries,
      logger as any,
      observability
    );

    const destinationController = new DestinationController(
      services.registerDestination,
      repositories.destinations,
      logger as any,
      observability
    );

    const deliveryController = new DeliveryController(
      repositories.deliveries,
      repositories.attempts,
      logger as any,
      observability,
      queue
    );

    // HealthController depends on DependencyChecker
    const dependencyChecker = new DependencyChecker(
      prisma,
      redis,
      queue,
      logger as any,
      observability.metrics
    );
    const healthController = new HealthController(dependencyChecker, logger as any);

    const dashboardController = new DashboardController(
      repositories,
      observability.metrics,
      logger as any,
      queue,
      redis
    );

    // 2. Instantiate and build the Express Application
    const app = createApp({
      authGuard: security.authGuard,
      rateLimiter: security.rateLimiter,
      validator: security.validator,
      logger,
      resultController,
      lineageController,
      destinationController,
      deliveryController,
      healthController,
      dashboardController,
    });

    logger.info('[ApiSetup] Express REST API app assembly completed successfully.');
    return app;
  } catch (err: any) {
    logger.error('[ApiSetup] Failed to configure API REST routes and controllers', err);
    throw err;
  }
}
