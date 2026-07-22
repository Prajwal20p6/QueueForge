import { DashboardData } from '../types/admin.types';

export interface DashboardResponseDTO {
  success: boolean;
  data: DashboardData;
}

export interface PaginatedResponseDTO<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BatchOperationResultDTO {
  successCount: number;
  failureCount: number;
  details: { id: string; success: boolean; error?: string }[];
}
