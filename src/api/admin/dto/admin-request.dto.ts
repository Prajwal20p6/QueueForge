import { z } from 'zod';

export const RetryBatchSchema = z.object({
  deliveryIds: z.array(z.string().uuid()).min(1).max(1000),
});

export type RetryBatchRequestDTO = z.infer<typeof RetryBatchSchema>;

export const RecoverDLQBatchSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(1000),
});

export type RecoverDLQBatchRequestDTO = z.infer<typeof RecoverDLQBatchSchema>;

export const CreateApiKeyRequestSchema = z.object({
  name: z.string().min(1).max(100),
  tier: z.enum(['FREE', 'STANDARD', 'PREMIUM', 'ENTERPRISE']),
  quotaOverride: z.number().positive().optional(),
});

export type CreateApiKeyRequestDTO = z.infer<typeof CreateApiKeyRequestSchema>;

export const ExportRequestSchema = z.object({
  entityType: z.enum(['DELIVERIES', 'AUDIT_LOGS', 'METRICS']),
  format: z.enum(['JSON', 'CSV', 'PARQUET']),
  filters: z.record(z.any()).optional(),
});

export type ExportRequestDTO = z.infer<typeof ExportRequestSchema>;

export const CreateRoleRequestSchema = z.object({
  name: z.string().min(1),
  permissions: z.array(z.string()),
});

export type CreateRoleRequestDTO = z.infer<typeof CreateRoleRequestSchema>;

export const CreateUserRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  roleIds: z.array(z.string()),
});

export type CreateUserRequestDTO = z.infer<typeof CreateUserRequestSchema>;
