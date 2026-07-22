import { Request, Response, NextFunction } from 'express';
import { DeliveryExplorerService } from '../services/delivery-explorer.service';

/**
 * REST controller exploring, filtering, and sorting deliveries.
 */
export class DeliveryExplorerController {
  constructor(private readonly explorerService: DeliveryExplorerService) {}

  public listDeliveries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.explorerService.listDeliveries(req.query as any);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit) || 1,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public getDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const delivery = await this.explorerService.getDeliveryDetail(req.params.id);
      if (!delivery) {
        res.status(404).json({ success: false, error: 'Delivery not found' });
        return;
      }
      res.status(200).json({ success: true, data: delivery });
    } catch (err) {
      next(err);
    }
  };
}
