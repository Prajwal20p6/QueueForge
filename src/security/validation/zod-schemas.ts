import { z } from 'zod';

export * from '../../shared/schemas';

/**
 * IngestResultRequestSchema:
 * Validates request payload properties for AI task results ingestion.
 */
export const IngestResultRequestSchema = z.object({
  emailId: z.string().email({ message: 'Invalid email address format' }),
  agentId: z.string().min(1, { message: 'Agent ID must be a non-empty string' }),
  agentVersion: z.string().min(1, { message: 'Agent version must be a non-empty string' }),
  resultPayload: z.record(z.any()).refine(payload => Object.keys(payload).length > 0, {
    message: 'Result payload cannot be empty',
  }),
  confidenceScore: z
    .number()
    .min(0, { message: 'Confidence score must be at least 0.0' })
    .max(1, { message: 'Confidence score cannot exceed 1.0' }),
});

/**
 * CreateDestinationRequestSchema:
 * Validates request payload properties for destination target registrations.
 */
export const CreateDestinationRequestSchema = z.object({
  endpointUrl: z.string().url({ message: 'Invalid destination endpoint URL format' }),
  destinationType: z.enum(['WEBHOOK', 'DATABASE', 'QUEUE'], {
    errorMap: () => ({ message: 'Destination type must be one of: WEBHOOK, DATABASE, QUEUE' }),
  }),
  eventFilters: z.array(z.string()).optional().default([]),
  enabled: z.boolean().optional().default(true),
});

/**
 * CreateDeliveryRequestSchema:
 * Validates request payload properties for manual delivery executions.
 */
export const CreateDeliveryRequestSchema = z.object({
  taskResultId: z.string().uuid({ message: 'Task result ID must be a valid UUID' }),
  destinationId: z.string().uuid({ message: 'Destination ID must be a valid UUID' }),
});

/**
 * PaginationSchema:
 * Validates collection paging parameters.
 */
export const PaginationSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(1000).optional().default(25),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * Validation schema for endpoint login requests.
 */
export const LoginSchema = z.union([
  z.object({
    apiKey: z.string().min(32),
  }),
  z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  }),
]);

/**
 * Validation schema for standard error JSON payloads.
 */
export const ErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
});

/**
 * Validation schema for standard successful JSON payloads.
 */
export const SuccessResponseSchema = z.object({
  data: z.any(),
  meta: z
    .object({
      timestamp: z.string(),
      version: z.string(),
    })
    .optional(),
});

export interface ValidationResult<T = any> {
  valid: boolean;
  data?: T;
  errors?: any[];
}
export { z };
export type IngestResultRequestType = z.infer<typeof IngestResultRequestSchema>;
export type CreateDestinationRequestType = z.infer<typeof CreateDestinationRequestSchema>;
export type CreateDeliveryRequestType = z.infer<typeof CreateDeliveryRequestSchema>;
