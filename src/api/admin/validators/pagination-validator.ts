/**
 * Pagination and sorting validator utility.
 */
export class PaginationValidator {
  public static validatePage(page?: number): number {
    if (!page || isNaN(page) || page < 1) return 1;
    return Math.floor(page);
  }

  public static validateLimit(limit?: number): number {
    if (!limit || isNaN(limit) || limit < 1) return 50;
    return Math.min(Math.floor(limit), 100);
  }

  public static validateSort(sort?: string): { field: string; order: 'asc' | 'desc' } {
    if (!sort) return { field: 'createdAt', order: 'desc' };
    const [field, order] = sort.split(':');
    return {
      field: field || 'createdAt',
      order: order?.toLowerCase() === 'asc' ? 'asc' : 'desc',
    };
  }
}
