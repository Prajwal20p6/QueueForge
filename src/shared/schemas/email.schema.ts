import { z } from 'zod';

/**
 * Zod validation schema representing a valid email format under RFC 5321
 */
export const emailSchema = z
  .string()
  .email({ message: 'Invalid email address format' })
  .min(1, { message: 'Email address cannot be empty' })
  .max(254, { message: 'Email address cannot exceed 254 characters' });
