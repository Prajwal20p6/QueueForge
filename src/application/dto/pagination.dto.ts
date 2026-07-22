import { ValidationError } from '../../shared/errors/validation-error';

/**
 * Common request query parameter filters for paginated collections.
 */
export interface PaginationParams {
  /** Page number offset index (1-based, defaults to 1) */
  page?: number;
  /** Max records returned per list page (defaults to 50, max 1000) */
  limit?: number;
  /** Schema property column used to sort results */
  sort?: string;
  /** Collection sort ordering direction */
  order?: 'asc' | 'desc';
}

/**
 * Generic wrapper envelope structure for paginated response collections.
 */
export interface PaginatedResponse<T> {
  /** Data array of items */
  data: T[];
  /** Pagination metadata structure */
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  /** Top-level aliases for backward compatibility */
  total?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

/**
 * Calculates SQL or memory offset based on 1-based page and limit parameters.
 */
export function calculateOffset(page = 1, limit = 50): number {
  const validPage = Math.max(1, page);
  const validLimit = Math.max(1, limit);
  return (validPage - 1) * validLimit;
}

/**
 * Helper factory constructing a standardized PaginatedResponse envelope.
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page = 1,
  limit = 50
): PaginatedResponse<T> {
  const validPage = Math.max(1, page);
  const validLimit = Math.max(1, limit);
  const hasMore = validPage * validLimit < total;

  return {
    data,
    pagination: {
      page: validPage,
      limit: validLimit,
      total,
      hasMore,
    },
    total,
    page: validPage,
    limit: validLimit,
    hasMore,
  };
}

/**
 * Validates, normalizes, and assigns default parameter values to pagination filters.
 */
export function validate(params: PaginationParams = {}): Required<PaginationParams> {
  const page = params.page !== undefined ? Number(params.page) : 1;
  const limit = params.limit !== undefined ? Number(params.limit) : 50;
  const sort = params.sort !== undefined ? String(params.sort) : 'createdAt';
  const order = params.order !== undefined ? (String(params.order).toLowerCase() as 'asc' | 'desc') : 'desc';

  if (isNaN(page) || page <= 0) {
    throw new ValidationError('page', { message: 'Page must be an integer greater than 0' });
  }

  if (isNaN(limit) || limit <= 0 || limit > 1000) {
    throw new ValidationError('limit', { message: 'Limit must be an integer between 1 and 1000' });
  }

  if (sort && !/^[a-zA-Z0-9_]+$/.test(sort)) {
    throw new ValidationError('sort', { message: 'Sort column must be alphanumeric' });
  }

  if (order !== 'asc' && order !== 'desc') {
    throw new ValidationError('order', { message: 'Order must be either asc or desc' });
  }

  return {
    page,
    limit,
    sort,
    order,
  };
}
