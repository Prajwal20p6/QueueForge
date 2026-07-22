import http from 'http';
import https from 'https';

/**
 * Controller orchestrating zero-downtime graceful shutdown, draining HTTP traffic, workers, and background daemons.
 */
export class GracefulShutdown {
  private isShuttingDown = false;

  constructor(
    private readonly server?: http.Server | https.Server | any,
    private readonly worker?: any,
    private readonly daemons?: any,
    private readonly logger?: any,
    private readonly container?: any
  ) {}

  /**
   * Executes step-by-step graceful teardown sequence.
   */
  public async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    this.logger?.info?.('[GracefulShutdown] Initiating graceful shutdown sequence...');

    const shutdownTimeout = setTimeout(() => {
      this.logger?.error?.('[GracefulShutdown] Shutdown timed out after 30s. Forcing emergency exit...');
      this.force();
    }, 30000);

    try {
      // 1. Close HTTP server (stop accepting new connections)
      if (this.server && typeof this.server.close === 'function') {
        this.logger?.info?.('[GracefulShutdown] 1/6 Closing HTTP server connection listener...');
        await new Promise<void>(resolve => {
          this.server.close(() => resolve());
        });
      }

      // 2. Stop background daemons
      if (this.daemons && typeof this.daemons.stop === 'function') {
        this.logger?.info?.('[GracefulShutdown] 2/6 Stopping background daemons...');
        await this.daemons.stop().catch(() => {});
      }

      // 3. Stop background workers
      if (this.worker && typeof this.worker.stop === 'function') {
        this.logger?.info?.('[GracefulShutdown] 3/6 Draining worker queues and stopping workers...');
        await this.worker.stop().catch(() => {});
      }

      // 4. Close queue connections
      const qm = this.container?.has?.('queueManager') ? this.container.get('queueManager') : null;
      if (qm && typeof qm.close === 'function') {
        this.logger?.info?.('[GracefulShutdown] 4/6 Closing BullMQ queue connections...');
        await qm.close().catch(() => {});
      }

      // 5. Close Redis connections
      const redisOps = this.container?.has?.('redisOperations') ? this.container.get('redisOperations') : null;
      if (redisOps && typeof redisOps.close === 'function') {
        this.logger?.info?.('[GracefulShutdown] 5/6 Closing Redis cache connections...');
        await redisOps.close().catch(() => {});
      }

      // 6. Close database connections
      const prisma = this.container?.has?.('connectionPool') ? this.container.get('connectionPool') : null;
      if (prisma && typeof prisma.$disconnect === 'function') {
        this.logger?.info?.('[GracefulShutdown] 6/6 Disconnecting PostgreSQL pool...');
        await prisma.$disconnect().catch(() => {});
      }

      clearTimeout(shutdownTimeout);
      this.logger?.info?.('[GracefulShutdown] Graceful shutdown sequence completed successfully.');
    } catch (err: any) {
      clearTimeout(shutdownTimeout);
      this.logger?.error?.(`[GracefulShutdown] Error during shutdown: ${err.message}`);
    }
  }

  /**
   * Immediately forces process termination (emergency use only).
   */
  public force(): void {
    this.logger?.error?.('[GracefulShutdown] FORCING IMMEDIATE PROCESS EXIT.');
    process.exit(1);
  }
}
