import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit-service';

/**
 * REST controller querying compliance audit trails and security logs.
 */
export class AuditExplorerController {
  constructor(private readonly auditService: AuditService) {}

  public listAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const logs = await this.auditService.listAuditLogs(req.query);
      res.status(200).json({ success: true, data: logs.data, total: logs.total });
    } catch (err) {
      next(err);
    }
  };

  public generateComplianceReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const report = await this.auditService.generateComplianceReport(
        (startDate as string) || new Date().toISOString(),
        (endDate as string) || new Date().toISOString()
      );
      res.status(200).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  };
}
