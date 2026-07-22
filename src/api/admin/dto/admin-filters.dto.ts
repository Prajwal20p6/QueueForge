import { z } from 'zod';

export const DeliveryFilterSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED_RETRY', 'FAILED_DLQ', 'CANCELLED']).optional(),
  destinationType: z.enum(['WEBHOOK', 'DATABASE', 'QUEUE', 'AUDIT']).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  sort: z.string().optional(),
});

export type DeliveryFilterDTO = z.infer<typeof DeliveryFilterSchema>;

export const DeliverySearchSchema = DeliveryFilterSchema.extend({
  emailId: z.string().optional(),
  agentId: z.string().optional(),
  deliveryId: z.string().uuid().optional(),
  destinationId: z.string().uuid().optional(),
  hasError: z.boolean().optional(),
});

export type DeliverySearchDTO = z.infer<typeof DeliverySearchSchema>;

export const AuditLogFilterSchema = z.object({
  eventType: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export type AuditLogFilterDTO = z.infer<typeof AuditLogFilterSchema>;
