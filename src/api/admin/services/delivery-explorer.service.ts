import { DeliveryFilterDTO, DeliverySearchDTO } from '../dto/admin-filters.dto';
import { PaginationValidator } from '../validators/pagination-validator';

/**
 * Service facilitating multi-criteria query and inspection of deliveries.
 */
export class DeliveryExplorerService {
  constructor(
    private readonly deliveryRepository?: any,
    logger?: any
  ) {
    if (logger) {
      logger.debug?.('[DeliveryExplorerService] Initialized');
    }
  }

  public async listDeliveries(filters: DeliveryFilterDTO): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const page = PaginationValidator.validatePage(filters.page);
    const limit = PaginationValidator.validateLimit(filters.limit);

    if (this.deliveryRepository?.findMany) {
      const where: any = {};
      if (filters.status) where.status = filters.status;
      const res = await this.deliveryRepository.findMany(where, { page, limit });
      return {
        data: res.data || res,
        total: res.total || (res.length ? res.length : 0),
        page,
        limit,
      };
    }

    return { data: [], total: 0, page, limit };
  }

  public async searchDeliveries(filters: DeliverySearchDTO): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    return this.listDeliveries(filters);
  }

  public async getDeliveryDetail(id: string): Promise<any> {
    if (this.deliveryRepository?.findById) {
      return this.deliveryRepository.findById(id);
    }
    return null;
  }
}
