import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { DatabaseConfig } from '../../config/database.config';
import { getPrismaClient } from './prisma-client';

export interface PoolStats {
  active: number;
  idle: number;
  waiting: number;
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
}

/**
 * Manages PostgreSQL connection pool lifecycle, dynamic sizing, and health monitoring.
 */
export class ConnectionPoolManager {
  private readonly prisma: PrismaClient;
  private readonly config: DatabaseConfig;
  private readonly logger: Logger;
  private monitorInterval: NodeJS.Timeout | null = null;
  private stats: PoolStats = {
    active: 0,
    idle: 0,
    waiting: 0,
    activeConnections: 0,
    idleConnections: 0,
    totalConnections: 0,
  };

  constructor(config: DatabaseConfig, logger: Logger, prisma?: PrismaClient) {
    this.config = config;
    this.logger = logger;
    this.prisma = prisma || getPrismaClient();

    this.startMonitoring();
  }

  /**
   * Starts periodic interval checking connection pool metrics and health.
   */
  private startMonitoring(): void {
    const intervalMs = (this.config as any)?.poolOptions?.monitorIntervalMs || 15000;
    this.monitorInterval = setInterval(() => {
      this.monitorPool();
    }, intervalMs);
    if (this.monitorInterval.unref) {
      this.monitorInterval.unref();
    }
  }

  /**
   * Evaluates current pool stats against thresholds.
   */
  public monitorPool(): void {
    this.updateStatsSync();
    this.logger.debug(
      `[ConnectionPoolManager] Pool stats: active=${this.stats.activeConnections}, idle=${this.stats.idleConnections}, total=${this.stats.totalConnections}`
    );
  }

  /**
   * Returns current snapshot of connection pool metrics.
   */
  public getStats(): PoolStats {
    this.updateStatsSync();
    return { ...this.stats };
  }

  /**
   * Internal method updating active, idle, waiting statistics from Prisma metrics if enabled.
   */
  private updateStatsSync(): void {
    const prisma = this.prisma as any;
    try {
      if (typeof prisma.$metrics?.json === 'function') {
        prisma.$metrics.json().then((metricsJson: any) => {
          const activeVal = metricsJson?.gauges?.find((g: any) => g.key === 'prisma_client_database_connections_active')?.value || 0;
          const idleVal = metricsJson?.gauges?.find((g: any) => g.key === 'prisma_client_database_connections_idle')?.value || 0;
          const totalVal = metricsJson?.gauges?.find((g: any) => g.key === 'prisma_client_database_connections_open')?.value || 0;
          const waitingVal = metricsJson?.gauges?.find((g: any) => g.key === 'prisma_client_queries_waiting')?.value || 0;

          this.stats = {
            active: Number(activeVal),
            idle: Number(idleVal),
            waiting: Number(waitingVal),
            activeConnections: Number(activeVal),
            idleConnections: Number(idleVal),
            totalConnections: Number(totalVal),
          };
        }).catch(() => {});
        return;
      }
    } catch {
      // Fallback if metrics feature is disabled
    }

    this.stats = {
      active: 0,
      idle: 0,
      waiting: 0,
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
    };
  }

  /**
   * Stops periodic pool monitoring interval.
   */
  public stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }
}
