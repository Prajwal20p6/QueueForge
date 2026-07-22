import { z } from 'zod';

export const UpdateConfigurationSchema = z.object({
  environment: z.string().optional(),
  retentionDays: z.number().min(1).max(365).optional(),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  roles: z.array(z.string()).nonempty(),
});

export const CreateRoleSchema = z.object({
  name: z.string().min(3).max(30),
  permissions: z.array(z.string()),
});
