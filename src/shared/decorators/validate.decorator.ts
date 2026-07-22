import { z } from 'zod';
import { ValidationError } from '../errors/validation-error';

/**
 * Method decorator that validates the first argument of a class method against a Zod schema.
 * Replaces the raw parameter with the parsed/coerced schema object.
 * Throws a ValidationError if the payload fails validation checks.
 * @param schema - Zod validation schema definition
 */
export function Validate(schema: z.ZodSchema<any>): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);
    const className = target.constructor?.name || 'UnknownClass';

    descriptor.value = function (...args: any[]): any {
      const firstArg = args[0];
      const result = schema.safeParse(firstArg);

      if (!result.success) {
        throw new ValidationError(
          `Validation failed for method ${className}.${methodName}`,
          result.error.errors
        );
      }

      // Assign the validated and coerced data back to the first argument
      args[0] = result.data;
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
