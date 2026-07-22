import { z } from 'zod';

/**
 * Zod validation schema representing individual task dispatches
 */
export const deliverySchema = z.object({
  task_result_id: z.string().uuid({ message: 'Invalid Task Result ID format. Must be UUID.' }),
  destination_id: z.string().uuid({ message: 'Invalid Destination ID format. Must be UUID.' }),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED'], {
    errorMap: () => ({ message: 'Status must be one of: PENDING, SUCCESS, FAILED' }),
  }),
  retry_count: z
    .number()
    .int({ message: 'Retry count must be an integer' })
    .nonnegative({ message: 'Retry count must be greater than or equal to 0' }),
  next_retry_at: z.union([z.date(), z.string().datetime()]).nullable().optional(),
});

export type DeliverySchemaType = z.infer<typeof deliverySchema>;

/**
 * Zod validation schema for creating a delivery dispatch
 */
export const createDeliverySchema = z.object({
  task_result_id: z.string().uuid({ message: 'Invalid Task Result ID format' }),
  destination_id: z.string().uuid({ message: 'Invalid Destination ID format' }),
});

/**
 * Zod validation schema for updating delivery status
 */
export const updateDeliveryStatusSchema = z.object({
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED'], {
    errorMap: () => ({ message: 'Invalid status value' }),
  }),
});
