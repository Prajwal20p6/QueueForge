import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../services/api-key-service';

/**
 * REST controller managing API key lifecycle, quotas, and tier limits.
 */
export class ApiKeyManagerController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  public listApiKeys = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const keys = await this.apiKeyService.listApiKeys();
      res.status(200).json({ success: true, data: keys });
    } catch (err) {
      next(err);
    }
  };

  public createApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, tier, quotaOverride } = req.body;
      const result = await this.apiKeyService.createApiKey(name, tier, quotaOverride);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  public revokeApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.apiKeyService.revokeApiKey(req.params.keyId);
      res.status(200).json({ success: true, message: `API Key ${req.params.keyId} revoked` });
    } catch (err) {
      next(err);
    }
  };
}
