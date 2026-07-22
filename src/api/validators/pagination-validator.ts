import { z } from 'zod';
import { Validator } from '../../security/validation/validator';
import { ValidationError } from '../../shared/errors/validation-error';
import { Logger } from '../../observability/logging/logger';

export interface PaginationParams {
  page: number;
  limit: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

const paginationCoerceSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(25),
  orderBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * Validator parsing and coercing request query string values for paging parameters.
 */
export class PaginationValidator {
  private readonly validator: Validator;
  private readonly logger: Logger;

  constructor(validator: Validator, logger: Logger) {
    this.validator = validator;
    this.logger = logger;
  }

  /**
   * Validates query parameters and coerces them into PaginationParams structure.
   */
  public async validatePaginationParams(req: any): Promise<PaginationParams> {
    const result = this.validator.validate<PaginationParams>(paginationCoerceSchema, req);

    if (!result.valid) {
      this.logger.warn('[PaginationValidator] Pagination parameters validation failed');
      throw new ValidationError('Validation failed for pagination parameters', result.errors || []);
    }

    return result.data!;
  }
}
