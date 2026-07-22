import { DeliveryResponse, DeliveryListResponse, RetryDeliveryResponse } from '../dto/delivery.dto';
import { PaginationParams, PaginatedResponse } from '../dto/pagination.dto';

/**
 * Service interface for delivery processing, queries, and manual retry management.
 */
export interface IDeliveryService {
  /**
   * Retrieves a single delivery record by its unique identifier reference.
   */
  getDelivery(id: string): Promise<DeliveryResponse>;

  /**
   * Lists delivery records matching pagination query parameters.
   */
  listDeliveries(pagination: PaginationParams): Promise<PaginatedResponse<DeliveryResponse> | DeliveryListResponse>;

  /**
   * Executes dispatch attempt for a specific delivery job.
   */
  processDelivery(id: string): Promise<any>;

  /**
   * Manually triggers a retry attempt for a failed delivery.
   */
  retry(id: string): Promise<RetryDeliveryResponse | void>;
}
