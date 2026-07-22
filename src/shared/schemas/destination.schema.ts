import { z } from 'zod';

/**
 * Zod validation schema representing destination webhook configurations parameters
 */
export const webhookConfigSchema = z.object({
  url: z.string().url({ message: 'Webhook endpoint must be a valid HTTP/HTTPS URL' }),
  secret: z.string().min(32, { message: 'Webhook HMAC secret must be at least 32 characters' }).optional(),
});

/**
 * Zod validation schema representing destination database configurations parameters
 */
export const databaseConfigSchema = z.object({
  connectionString: z.string().min(1, { message: 'Database connection string is required' }),
});

/**
 * Zod validation schema representing destination queue configurations parameters
 */
export const queueConfigSchema = z.object({
  queueName: z.string().min(1, { message: 'Queue target name is required' }),
});

/**
 * Zod validation schema representing destination target registrations
 */
export const destinationSchema = z.object({
  endpoint_url: z.string().url({ message: 'Invalid destination endpoint URL format' }),
  destination_type: z.enum(['WEBHOOK', 'DATABASE', 'QUEUE'], {
    errorMap: () => ({ message: 'Destination type must be one of: WEBHOOK, DATABASE, QUEUE' }),
  }),
  event_filters: z.array(z.string()).optional().default([]),
  enabled: z.boolean().optional().default(true),
  webhookConfig: webhookConfigSchema.optional(),
  databaseConfig: databaseConfigSchema.optional(),
  queueConfig: queueConfigSchema.optional(),
});

export type DestinationSchemaType = z.infer<typeof destinationSchema>;
export type WebhookConfigSchemaType = z.infer<typeof webhookConfigSchema>;
export type DatabaseConfigSchemaType = z.infer<typeof databaseConfigSchema>;
export type QueueConfigSchemaType = z.infer<typeof queueConfigSchema>;
