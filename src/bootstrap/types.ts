import { Application } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Config } from '../config';
import { Logger } from '../observability/logging/logger';
import { QueueManager } from '../infrastructure/queue/bullmq-client';
import { ObservabilityContext } from '../observability/types';
import { SecurityContext } from './security-setup';
import { ResilienceContext } from './resilience-setup';
import { Worker } from '../worker/processor';
import { DaemonCoordinator } from '../daemon';
import { Server } from 'http';

/**
 * Result structure returned by the startup verification suite.
 */
export interface StartupValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Context containing all core backing infrastructure, applications and background daemons.
 */
export interface BootstrapContext {
  config: Config;
  logger: Logger;
  prisma: PrismaClient;
  redis: Redis;
  queueManager: QueueManager;
  observability: ObservabilityContext;
  security: SecurityContext;
  resilience: ResilienceContext;
  worker: Worker | null;
  daemon: DaemonCoordinator | null;
  api: Application | null;
  server: Server | null;
}

/**
 * Interface defining the methods to retrieve instantiated layer contexts from dependency injection container.
 */
export interface DependencyContainer {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  getConfig(): Config;
  getLogger(): Logger;
  getPrisma(): PrismaClient;
  getRedis(): Redis;
  getQueueManager(): QueueManager;
  getObservability(): ObservabilityContext;
  getSecurity(): SecurityContext;
  getResilience(): ResilienceContext;
  getWorker(): Worker | null;
  getDaemon(): DaemonCoordinator | null;
  getApi(): Application | null;
  getServer(): Server | null;
}

/**
 * Lifecycle execution states of the core pipeline process.
 */
export type ApplicationState = 'INITIALIZING' | 'RUNNING' | 'SHUTTING_DOWN' | 'STOPPED' | 'ERROR';
