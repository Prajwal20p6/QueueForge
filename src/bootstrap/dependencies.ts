import { Application } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Server } from 'http';
import { Config } from '../config';
import { Logger } from '../observability/logging/logger';
import { QueueManager } from '../infrastructure/queue/bullmq-client';
import { ObservabilityContext } from '../observability/types';
import { SecurityContext } from './security-setup';
import { ResilienceContext } from './resilience-setup';
import { Worker } from '../worker/processor';
import { DaemonCoordinator } from '../daemon';
import { Repositories, initializeRepositories } from '../infrastructure/repositories';
import { ServiceContainer, createServiceContainer } from '../application/services';
import { IdempotencyCache } from '../infrastructure/cache/idempotency-cache';

import { setupDatabase } from './database-setup';
import { setupRedis } from './redis-setup';
import { setupQueue } from './queue-setup';
import { setupObservability } from './observability-setup';
import { setupSecurity } from './security-setup';
import { setupResilience } from './resilience-setup';
import { setupWorker } from './worker-setup';
import { setupDaemon } from './daemon-setup';
import { setupApi } from './api-setup';
import { disconnectDatabase } from '../infrastructure/database/client';

/**
 * Dependency Injection Container orchestrating the initialization, retrieval, and disposal of core pipeline components.
 */
export class DependencyContainer {
  private readonly config: Config;
  private readonly logger: Logger;

  private prisma!: PrismaClient;
  private redis!: Redis;
  private queueManager!: QueueManager;
  private observability!: ObservabilityContext;
  private security!: SecurityContext;
  private resilience!: ResilienceContext;
  private repositories!: Repositories;
  private services!: ServiceContainer;
  private worker: Worker | null = null;
  private daemon: DaemonCoordinator | null = null;
  private api: Application | null = null;
  private server: Server | null = null;

  private initialized = false;

  constructor(config: Config, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Initializes all application layers and dependencies in the correct dependency order.
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('[DependencyContainer] Dependencies already initialized.');
      return;
    }

    this.logger.info('[DependencyContainer] Starting sequential initialization of all services...');

    try {
      // 1. Database (Prisma) Connection and validation checks
      this.prisma = await setupDatabase(this.config, this.logger);

      // 2. Redis Client Connection
      this.redis = await setupRedis(this.config, this.logger);

      // 3. Repositories initialization
      this.repositories = await initializeRepositories(this.prisma, this.logger as any);

      // 4. BullMQ Queue Manager initialization
      this.queueManager = await setupQueue(this.redis, this.config, this.logger);

      // 5. Observability Subsystems setup (OpenTelemetry, Prometheus, AuditLogger)
      this.observability = await setupObservability(this.config, this.logger);

      // 6. Security context setup (JWT Strategy, RateLimiter, SecretsManager)
      this.security = await setupSecurity(this.config, this.logger, this.redis);

      // 7. Resilience Context setup (Circuit breakers, bulkheads, retry engine)
      this.resilience = await setupResilience(
        this.redis,
        this.queueManager.getMainQueue(),
        this.config,
        this.logger,
        this.observability.metrics
      );

      // 8. Application Services initialization using the Idempotency Cache
      const cache = new IdempotencyCache(this.redis, this.config.security || {});
      this.services = createServiceContainer({
        resultRepository: this.repositories.results,
        deliveryRepository: this.repositories.deliveries,
        destinationRepository: this.repositories.destinations,
        attemptRepository: this.repositories.attempts,
        queue: this.queueManager.getMainQueue(),
        cache,
        logger: this.logger as any,
        metrics: this.observability.metrics,
        tracer: this.observability.tracer as any,
      });

      // 9. Background Worker bootstrap
      this.worker = await setupWorker(this.config, this, this.logger);

      // 10. Background Daemons bootstrap
      this.daemon = await setupDaemon(this.config, this, this.logger);

      // 11. REST API Express App initialization
      this.api = await setupApi(this.config, this, this.logger);

      this.initialized = true;
      this.logger.info('[DependencyContainer] All dependencies initialized successfully.');
    } catch (err: any) {
      this.logger.error('[DependencyContainer] Critical failure during container initialization!', err);
      throw err;
    }
  }

  /**
   * Disposes, closes and cleans up all active services.
   */
  public async shutdown(): Promise<void> {
    if (!this.initialized) {
      this.logger.warn('[DependencyContainer] Dependencies are not initialized. Skipping shutdown.');
      return;
    }

    this.logger.info('[DependencyContainer] Executing graceful shutdown sequence...');

    // 1. Stop Worker listeners
    if (this.worker) {
      try {
        await this.worker.stop();
        this.logger.info('[DependencyContainer] Background Worker cleanly stopped.');
      } catch (err: any) {
        this.logger.error('[DependencyContainer] Error stopping Worker', err);
      }
    }

    // 2. Stop Daemon loops
    if (this.daemon) {
      try {
        await this.daemon.stop();
        this.logger.info('[DependencyContainer] Background Daemons Coordinator cleanly stopped.');
      } catch (err: any) {
        this.logger.error('[DependencyContainer] Error stopping Daemon loops', err);
      }
    }

    // 3. Telemetry Exporters flush
    if (this.observability?.tracer) {
      try {
        await this.observability.tracer.shutdown();
        this.logger.info('[DependencyContainer] OpenTelemetry tracer shutdown completed.');
      } catch (err: any) {
        this.logger.error('[DependencyContainer] Error shutting down tracer SDK', err);
      }
    }

    // 4. Redis connection close
    if (this.redis) {
      try {
        await this.redis.quit();
        this.logger.info('[DependencyContainer] Redis client connection closed.');
      } catch (err: any) {
        this.logger.error('[DependencyContainer] Error closing Redis client connection', err);
      }
    }

    // 5. Database Connection close
    try {
      await disconnectDatabase();
      this.logger.info('[DependencyContainer] Database connection pool closed.');
    } catch (err: any) {
      this.logger.error('[DependencyContainer] Error disconnecting from Database', err);
    }

    this.initialized = false;
    this.logger.info('[DependencyContainer] Graceful shutdown process finalized.');
  }

  public getConfig(): Config {
    return this.config;
  }

  public getLogger(): Logger {
    return this.logger;
  }

  public getPrisma(): PrismaClient {
    return this.prisma;
  }

  public getRedis(): Redis {
    return this.redis;
  }

  public getQueueManager(): QueueManager {
    return this.queueManager;
  }

  public getObservability(): ObservabilityContext {
    return this.observability;
  }

  public getSecurity(): SecurityContext {
    return this.security;
  }

  public getResilience(): ResilienceContext {
    return this.resilience;
  }

  public getRepositories(): Repositories {
    return this.repositories;
  }

  public getServices(): ServiceContainer {
    return this.services;
  }

  public getWorker(): Worker | null {
    return this.worker;
  }

  public getDaemon(): DaemonCoordinator | null {
    return this.daemon;
  }

  public getApi(): Application | null {
    return this.api;
  }

  public getServer(): Server | null {
    return this.server;
  }

  /**
   * Sets the HTTP server handle.
   */
  public setServer(server: Server | null): void {
    this.server = server;
  }
}

// Singleton Pattern Implementation
let singletonInstance: DependencyContainer | null = null;

/**
 * Singleton getter retrieving the active global container context.
 */
export function getDependencyContainer(config?: Config, logger?: Logger): DependencyContainer {
  if (!singletonInstance) {
    if (!config || !logger) {
      throw new Error('[DependencyContainer] Singleton container must be initialized first with Config and Logger.');
    }
    singletonInstance = new DependencyContainer(config, logger);
  }
  return singletonInstance;
}
