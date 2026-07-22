import { Request, Response, NextFunction } from 'express';
import { ConfigurationService } from '../services/configuration.service';

/**
 * REST controller for viewing and updating runtime configuration & feature flags.
 */
export class ConfigurationManagerController {
  constructor(private readonly configService: ConfigurationService) {}

  public getConfiguration = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await this.configService.getFullConfiguration();
      res.status(200).json({ success: true, data: config });
    } catch (err) {
      next(err);
    }
  };

  public getFeatureFlags = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const flags = await this.configService.getFeatureFlags();
      res.status(200).json({ success: true, data: flags });
    } catch (err) {
      next(err);
    }
  };

  public toggleFeatureFlag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { flag, enabled } = req.body;
      await this.configService.toggleFeatureFlag(flag, Boolean(enabled));
      res.status(200).json({ success: true, message: `Feature flag ${flag} set to ${enabled}` });
    } catch (err) {
      next(err);
    }
  };
}
