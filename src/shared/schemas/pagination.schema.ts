import { z } from 'zod';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants/defaults';

/**
 * Zod validation schema representing lists pagination parameters
 */
export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int({ message: 'Page index must be an integer' })
    .positive({ message: 'Page index must be positive (1 or greater)' })
    .optional()
    .default(1),
  limit: z.coerce
    .number()
    .int({ message: 'Limit must be an integer' })
    .positive({ message: 'Limit must be positive (1 or greater)' })
    .max(MAX_PAGE_SIZE, { message: `Limit cannot exceed maximum of ${MAX_PAGE_SIZE}` })
    .optional()
    .default(DEFAULT_PAGE_SIZE),
  sort: z.string().optional(),
  filter: z.string().optional(),
});

export type PaginationSchemaType = z.infer<typeof paginationSchema>;

export const pageSchema = z.coerce
  .number()
  .int({ message: 'Page must be an integer' })
  .positive({ message: 'Page must be 1 or greater' });

export const limitSchema = z.coerce
  .number()
  .int({ message: 'Limit must be an integer' })
  .min(1, { message: 'Limit must be at least 1' })
  .max(1000, { message: 'Limit cannot exceed 1000' });

export const paginationParamsSchema = z.object({
  page: pageSchema.optional().default(1),
  limit: limitSchema.optional().default(DEFAULT_PAGE_SIZE),
  sort: z.string().optional(),
  filter: z.string().optional(),
});

export type PaginationParamsSchemaType = z.infer<typeof paginationParamsSchema>;
