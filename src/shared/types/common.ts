/**
 * Key-value mapping representing structured schema metadata
 */
export interface Metadata {
  [key: string]: any;
}

/**
 * Normal pagination query filters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  filter?: string;
}

/**
 * Standard pagination metadata details
 */
export interface PageInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated response wrapper for collection models
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PageInfo;
}
