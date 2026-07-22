import { Request, Response, NextFunction } from 'express';
import { DaemonManagerService } from '../services/daemon-manager.service';

/**
 * REST controller controlling background system daemons.
 */
export class DaemonManagerController {
  constructor(private readonly daemonService: DaemonManagerService) {}

  public listDaemons = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const daemons = await this.daemonService.getDaemonList();
      res.status(200).json({ success: true, data: daemons });
    } catch (err) {
      next(err);
    }
  };

  public triggerDaemon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.daemonService.triggerDaemonRun(req.params.daemonId);
      res.status(200).json({ success: true, message: `Daemon ${req.params.daemonId} triggered` });
    } catch (err) {
      next(err);
    }
  };
}
