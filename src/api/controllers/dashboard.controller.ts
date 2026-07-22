import { Request, Response, NextFunction } from 'express';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { MetricsRegistry } from '../../observability/metrics/metrics-registry';
import { Logger } from '../../observability/logging/logger';
import { getPrismaClient } from '../../infrastructure/database/client';
import { DependencyChecker } from '../../daemon/health/dependency-checker';
import { WorkerMonitor } from '../../daemon/health/worker-monitor';
import { DeliveryStatus } from '@prisma/client';

/**
 * Controller class serving statistic endpoints for system admin dashboards.
 */
export class DashboardController {
  private readonly repositories: any;
  private readonly metricsRegistry: MetricsRegistry;
  private readonly logger: Logger;
  private readonly queue?: Queue;
  private readonly redis?: Redis;

  constructor(
    repositories: any,
    metricsRegistry: MetricsRegistry,
    logger: Logger,
    queue?: Queue,
    redis?: Redis
  ) {
    this.repositories = repositories;
    this.metricsRegistry = metricsRegistry;
    this.logger = logger;
    this.queue = queue;
    this.redis = redis;
    this.logger.debug('DashboardController initialized', { hasRepositories: !!this.repositories });
  }

  /**
   * Endpoint returning waits, delay depths, processing throughput rates, and worker counts.
   */
  public async queueStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!this.queue || !this.redis) {
        res.status(200).json({
          depth: { main: 0, delayed: 0, dlq: 0 },
          throughput: 0,
          successRate: 100,
          activeWorkers: 0,
        });
        return;
      }

      const [waiting, active, delayed, completed, failed] = await Promise.all([
        this.queue.getWaitingCount(),
        this.queue.getActiveCount(),
        this.queue.getDelayedCount(),
        this.queue.getCompletedCount(),
        this.queue.getFailedCount(),
      ]);

      const registered = await this.redis.smembers('workers:all');

      const totalOutcomes = completed + failed;
      const successRate = totalOutcomes > 0 ? (completed / totalOutcomes) * 100 : 100;

      res.status(200).json({
        depth: {
          main: waiting + active,
          delayed,
          dlq: failed,
        },
        throughput: completed,
        successRate,
        activeWorkers: registered.length,
      });
    } catch (err: any) {
      this.logger.error('[DashboardController] Failed to query queue stats', err);
      next(err);
    }
  }

  /**
   * Endpoint gathering delivery success metrics and destination-type partition breakdowns.
   */
  public async deliveryStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prisma = getPrismaClient();

      const total = await prisma.taskResultDelivery.count({
        where: { deletedAt: null },
      });
      const completed = await prisma.taskResultDelivery.count({
        where: { status: DeliveryStatus.COMPLETED, deletedAt: null },
      });
      const failed = await prisma.taskResultDelivery.count({
        where: { status: DeliveryStatus.FAILED_DLQ, deletedAt: null },
      });

      const successRate = total > 0 ? (completed / total) * 100 : 100;
      const failureRate = total > 0 ? (failed / total) * 100 : 0;

      const retriesAggr = await prisma.taskResultDelivery.aggregate({
        _avg: { retryCount: true },
        where: { deletedAt: null },
      });
      const avgRetries = retriesAggr._avg.retryCount || 0;

      const latencyAggr = await prisma.taskResultDeliveryAttempt.aggregate({
        _avg: { responseTimeMs: true },
      });
      const avgLatency = latencyAggr._avg.responseTimeMs || 0;

      // Group breakdown programmatically
      const deliveries = await prisma.taskResultDelivery.findMany({
        where: { deletedAt: null },
        include: { destination: true },
      });

      const typeMap: Record<string, { total: number; completed: number; failed: number }> = {};
      for (const d of deliveries) {
        const destType = d.destination.destinationType;
        if (!typeMap[destType]) {
          typeMap[destType] = { total: 0, completed: 0, failed: 0 };
        }
        typeMap[destType].total++;
        if (d.status === DeliveryStatus.COMPLETED) typeMap[destType].completed++;
        if (d.status === DeliveryStatus.FAILED_DLQ) typeMap[destType].failed++;
      }

      const byDestinationType: Record<string, any> = {};
      for (const [destType, stats] of Object.entries(typeMap)) {
        byDestinationType[destType] = {
          successRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 100,
          failureRate: stats.total > 0 ? (stats.failed / stats.total) * 100 : 0,
          count: stats.total,
        };
      }

      res.status(200).json({
        successRate,
        failureRate,
        dlqRate: failureRate,
        avgRetries,
        avgLatency,
        byDestinationType,
      });
    } catch (err: any) {
      this.logger.error('[DashboardController] Failed to query delivery stats', err);
      next(err);
    }
  }

  /**
   * Endpoint returning processing metrics and heartbeats values for active background workers.
   */
  public async workerStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!this.redis) {
        res.status(200).json({ active: [], stats: {} });
        return;
      }

      const monitor = new WorkerMonitor(this.redis, this.logger, this.metricsRegistry);
      const health = await monitor.checkWorkerHealth();
      const stats = await monitor.getWorkerStats();

      res.status(200).json({
        activeWorkers: health.activeWorkers,
        staleWorkers: health.staleWorkers,
        totalWorkers: health.totalWorkers,
        stats,
      });
    } catch (err: any) {
      this.logger.error('[DashboardController] Failed to query worker stats', err);
      next(err);
    }
  }

  /**
   * Endpoint returning overall health checks and recent failure alerts issues list.
   */
  public async systemHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!this.redis || !this.queue) {
        res.status(200).json({
          status: 'UNHEALTHY',
          issues: ['Redis/Queue dependencies missing on dashboard'],
        });
        return;
      }

      const prisma = getPrismaClient();
      const checker = new DependencyChecker(
        prisma,
        this.redis,
        this.queue,
        this.logger,
        this.metricsRegistry
      );

      const healthRes = await checker.checkAll();

      const issues: string[] = [];
      if (healthRes.database !== 'HEALTHY') issues.push(`Database connection is ${healthRes.database}`);
      if (healthRes.redis !== 'HEALTHY') issues.push(`Redis connection is ${healthRes.redis}`);
      if (healthRes.queue !== 'HEALTHY') issues.push(`BullMQ Queue is ${healthRes.queue}`);

      res.status(200).json({
        status: healthRes.overall,
        checks: {
          database: healthRes.database,
          redis: healthRes.redis,
          queue: healthRes.queue,
        },
        timestamp: healthRes.timestamp,
        issues,
      });
    } catch (err: any) {
      this.logger.error('[DashboardController] Failed to compile system health summary', err);
      next(err);
    }
  }
}
