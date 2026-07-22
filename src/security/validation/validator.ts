import { z } from 'zod';
import client from 'prom-client';
import { ValidationError } from '../../shared/errors/validation-error';
import { logger as globalLogger } from '../../infrastructure/logging/logger';

export interface FieldValidationError {
  field: string;
  message: string;
}

// Register prometheus metrics counters and histograms
export const valSuccessCounter =
  (client.register.getSingleMetric('validation_success_total') as client.Counter) ||
  new client.Counter({
    name: 'validation_success_total',
    help: 'Total number of successful validations',
  });

export const valFailureCounter =
  (client.register.getSingleMetric('validation_failure_total') as client.Counter) ||
  new client.Counter({
    name: 'validation_failure_total',
    help: 'Total number of failed validations',
  });

export const valLatencyHistogram =
  (client.register.getSingleMetric('validation_latency_ms') as client.Histogram) ||
  new client.Histogram({
    name: 'validation_latency_ms',
    help: 'Latency distribution of validation checks in milliseconds',
    buckets: [0.5, 1, 2.5, 5, 10, 25, 50],
  });

/**
 * Validator class executing Zod validations and converting ZodError structures.
 */
export class Validator {
  private readonly logger: any;

  constructor(logger?: any) {
    this.logger = logger || globalLogger;
  }

  /**
   * Evaluates if data complies with the schema, returning a parsed result or mapped field failures.
   * Supports both validate(schema, data) and legacy validate(data, schema).
   * Returns a Thenable object that can either be used synchronously (legacy) or awaited (new).
   */
  public validate<T>(
    schemaOrData: any,
    dataOrSchema: any
  ): { valid: boolean; data?: T; errors?: FieldValidationError[]; then?: any } {
    const startTime = Date.now();
    const isFirstSchema = schemaOrData && typeof schemaOrData.safeParse === 'function';
    const schema = (isFirstSchema ? schemaOrData : dataOrSchema) as z.ZodSchema;
    const data = isFirstSchema ? dataOrSchema : schemaOrData;

    const result = schema.safeParse(data);
    const duration = Date.now() - startTime;
    valLatencyHistogram.observe(duration);

    if (result.success) {
      valSuccessCounter.inc();
      const parsedData = result.data as T;

      return {
        valid: true,
        data: parsedData,
        then(onfulfilled: any) {
          if (onfulfilled) return onfulfilled(parsedData);
          return Promise.resolve(parsedData);
        },
      } as any;
    }

    valFailureCounter.inc();
    const errors: FieldValidationError[] = result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    this.logger.info(`Validation failed: ${JSON.stringify(errors)}`);

    return {
      valid: false,
      errors,
      then(_onfulfilled: any, onrejected: any) {
        const err = new ValidationError('Validation failed', errors);
        if (onrejected) return onrejected(err);
        return Promise.reject(err);
      },
    } as any;
  }

  /**
   * Validates partial object mapping using schema.partial().
   */
  public async validatePartial<T>(schema: z.ZodSchema, data: Partial<any>): Promise<Partial<T>> {
    if (schema instanceof z.ZodObject) {
      const partialSchema = schema.partial();
      return this.validate(partialSchema, data) as any;
    }
    return this.validate(schema, data) as any;
  }

  /**
   * Asserts request body matches schema, throwing a ValidationError on failure.
   */
  public async validateRequest(body: any, schema: z.ZodSchema): Promise<any> {
    const res = this.validate(body, schema);
    if (!res.valid) {
      throw new ValidationError('Validation failed', res.errors);
    }
    return res.data;
  }

  /**
   * Asserts query parameters match schema, throwing a ValidationError on failure.
   */
  public async validateQuery(query: any, schema: z.ZodSchema): Promise<any> {
    const res = this.validate(query, schema);
    if (!res.valid) {
      throw new ValidationError('Validation failed', res.errors);
    }
    return res.data;
  }

  /**
   * Asserts route parameters match schema, throwing a ValidationError on failure.
   */
  public async validateParams(params: any, schema: z.ZodSchema): Promise<any> {
    const res = this.validate(params, schema);
    if (!res.valid) {
      throw new ValidationError('Validation failed', res.errors);
    }
    return res.data;
  }
}
export { ValidationError };
