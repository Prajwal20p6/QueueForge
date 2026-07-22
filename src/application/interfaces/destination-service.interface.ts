import { CreateDestinationRequest, DestinationResponse, DestinationListResponse } from '../dto/destination.dto';
import { PaginationParams, PaginatedResponse } from '../dto/pagination.dto';
import { AiTaskResult } from '../../domain/entities/ai-task-result.entity';

/**
 * Service interface for managing delivery destination routes and filter matching.
 */
export interface IDestinationService {
  /**
   * Registers a new delivery destination route.
   */
  register(request: CreateDestinationRequest): Promise<DestinationResponse>;

  /**
   * Lists registered delivery destinations with pagination.
   */
  listDestinations(pagination: PaginationParams): Promise<PaginatedResponse<DestinationResponse> | DestinationListResponse>;

  /**
   * Finds all active destination routes matching event filter rules of a task result.
   */
  findMatching(result: AiTaskResult): Promise<DestinationResponse[]>;
}
