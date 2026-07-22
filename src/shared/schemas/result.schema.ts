import { z } from 'zod';

/**
 * Zod validation schema representing task result payload limits
 */
export const taskResultPayloadSchema = z.record(z.any()).refine(
  (payload) => Object.keys(payload).length > 0,
  { message: 'Result payload cannot be empty' }
);

/**
 * Zod validation schema representing incoming AI Task Results
 */
export const aiTaskResultSchema = z.object({
  email_id: z.string().email({ message: 'Invalid email address format' }),
  agent_id: z.string().min(1, { message: 'Agent ID must be a non-empty string' }),
  agent_version: z.string().min(1, { message: 'Agent version must be a non-empty string' }),
  result_payload: taskResultPayloadSchema,
  confidence_score: z
    .number()
    .min(0, { message: 'Confidence score must be at least 0.0' })
    .max(1, { message: 'Confidence score cannot exceed 1.0' }),
});

// Alias to maintain compatibility with existing codebase
export const aiResultSchema = aiTaskResultSchema;
export type AIResultSchemaType = z.infer<typeof aiResultSchema>;
export type AITaskResultSchemaType = z.infer<typeof aiTaskResultSchema>;
export type TaskResultPayloadSchemaType = z.infer<typeof taskResultPayloadSchema>;
