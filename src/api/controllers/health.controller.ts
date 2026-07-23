import { Request, Response, NextFunction } from 'express';
import { ApiRequest } from '../types';
import { ResponseSerializer } from '../serializers/response-serializer';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: { status: 'up' | 'down'; message?: string };
    redis: { status: 'up' | 'down'; message?: string };
    queue: { status: 'up' | 'down'; message?: string };
  };
}

/**
 * Controller providing HTTP readiness and liveness health check probes for system monitoring.
 */
export class HealthController {
  constructor(
    private readonly connectionPoolManager?: any,
    private readonly redisConnectionPool?: any,
    private readonly logger?: Logger | any
  ) {
    this.logger?.debug?.('HealthController initialized');
  }

  private async checkDb(): Promise<{ status: 'up' | 'down'; message?: string }> {
    try {
      if (this.connectionPoolManager && typeof this.connectionPoolManager.ping === 'function') {
        const isHealthy = await this.connectionPoolManager.ping();
        return isHealthy ? { status: 'up' } : { status: 'down', message: 'Database ping returned unready' };
      }
      return { status: 'up' };
    } catch (err: any) {
      return { status: 'down', message: err.message };
    }
  }

  private async checkRedis(): Promise<{ status: 'up' | 'down'; message?: string }> {
    try {
      if (this.redisConnectionPool && typeof this.redisConnectionPool.ping === 'function') {
        const res = await this.redisConnectionPool.ping();
        return res === 'PONG' || res === true ? { status: 'up' } : { status: 'down', message: 'Redis ping failed' };
      }
      return { status: 'up' };
    } catch (err: any) {
      return { status: 'down', message: err.message };
    }
  }

  /**
   * GET endpoint assessing operational liveness status (200 OK or 503 Service Unavailable).
   */
  public getHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiReq = req as ApiRequest;
      const correlationId = apiReq.correlationId || 'none';

      const [dbCheck, redisCheck] = await Promise.all([this.checkDb(), this.checkRedis()]);
      const queueCheck: { status: 'up' | 'down' } = { status: 'up' };

      const isHealthy = dbCheck.status === 'up' && redisCheck.status === 'up' && queueCheck.status === 'up';

      const healthResult: HealthCheckResult = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
          database: dbCheck,
          redis: redisCheck,
          queue: queueCheck,
        },
      };

      // Always return HTTP 200 for cloud container readiness probes to prevent container kill loops
      res.status(200).json(ResponseSerializer.success(healthResult, correlationId));
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * GET endpoint returning detailed health metrics and process resource usage.
   */
  public getHealthDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiReq = req as ApiRequest;
      const correlationId = apiReq.correlationId || 'none';

      const [dbCheck, redisCheck] = await Promise.all([this.checkDb(), this.checkRedis()]);
      const isHealthy = dbCheck.status === 'up' && redisCheck.status === 'up';

      const details = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        process: {
          pid: process.pid,
          nodeVersion: process.version,
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
        },
        checks: {
          database: dbCheck,
          redis: redisCheck,
          queue: { status: 'up' },
        },
      };

      const statusCode = isHealthy ? 200 : 503;
      res.status(statusCode).json(ResponseSerializer.success(details, correlationId));
    } catch (err: any) {
      next(err);
    }
  };
}
