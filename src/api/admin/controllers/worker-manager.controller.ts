import { Request, Response, NextFunction } from 'express';
import { WorkerManagerService } from '../services/worker-manager.service';

/**
 * REST controller monitoring and controlling worker cluster nodes.
 */
export class WorkerManagerController {
  constructor(private readonly workerService: WorkerManagerService) {}

  public listWorkers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workers = await this.workerService.getWorkerList();
      res.status(200).json({ success: true, data: workers });
    } catch (err) {
      next(err);
    }
  };

  public pauseWorker = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.workerService.pauseWorker(req.params.workerId);
      res.status(200).json({ success: true, message: `Worker ${req.params.workerId} paused` });
    } catch (err) {
      next(err);
    }
  };

  public resumeWorker = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.workerService.resumeWorker(req.params.workerId);
      res.status(200).json({ success: true, message: `Worker ${req.params.workerId} resumed` });
    } catch (err) {
      next(err);
    }
  };
}
