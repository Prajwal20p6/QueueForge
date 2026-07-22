import { Request, Response, NextFunction } from 'express';
import { ExportService } from '../services/export.service';

/**
 * REST controller orchestrating asynchronous data exports (JSON, CSV, Parquet).
 */
export class ExportsController {
  constructor(private readonly exportService: ExportService) {}

  public exportDeliveries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const format = req.body.format || 'JSON';
      const job = await this.exportService.createExportJob('DELIVERIES', format);
      res.status(202).json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  };

  public getExportStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = await this.exportService.getExportStatus(req.params.exportId);
      if (!status) {
        res.status(404).json({ success: false, error: 'Export job not found' });
        return;
      }
      res.status(200).json({ success: true, data: status });
    } catch (err) {
      next(err);
    }
  };
}
