import { Request, Response, NextFunction } from 'express';
import { DiagnosticService } from '../services/diagnostic-service';

/**
 * REST controller serving live system resource usage and performance diagnostics.
 */
export class SystemDiagnosticsController {
  constructor(private readonly diagnosticService: DiagnosticService) {}

  public getResourceUsage = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const usage = await this.diagnosticService.getResourceUsage();
      res.status(200).json({ success: true, data: usage });
    } catch (err) {
      next(err);
    }
  };

  public getPerformanceMetrics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const metrics = await this.diagnosticService.getPerformanceMetrics();
      res.status(200).json({ success: true, data: metrics });
    } catch (err) {
      next(err);
    }
  };
}
