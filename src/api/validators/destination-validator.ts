import { Validator } from '../../security/validation/validator';
import { CreateDestinationRequestSchema } from '../../security/validation/zod-schemas';
import { CreateDestinationRequest } from '../../application/dto/destination.dto';
import { ValidationError } from '../../shared/errors/validation-error';
import { Logger } from '../../observability/logging/logger';

/**
 * Validator verifying destination registration/update payloads.
 */
export class DestinationValidator {
  private readonly validator: Validator;
  private readonly logger: Logger;

  constructor(validator: Validator, logger: Logger) {
    this.validator = validator;
    this.logger = logger;
  }

  /**
   * Validates creation request parameters.
   */
  public async validateCreateRequest(req: any): Promise<CreateDestinationRequest> {
    const result = this.validator.validate<CreateDestinationRequest>(
      CreateDestinationRequestSchema,
      req
    );

    if (!result.valid) {
      this.logger.warn('[DestinationValidator] Create request validation failed');
      throw new ValidationError('Validation failed for create destination request', result.errors || []);
    }

    return result.data!;
  }

  /**
   * Validates update request parameters.
   */
  public async validateUpdateRequest(req: any): Promise<Partial<CreateDestinationRequest>> {
    const updateSchema = CreateDestinationRequestSchema.partial();
    const result = this.validator.validate<Partial<CreateDestinationRequest>>(
      updateSchema,
      req
    );

    if (!result.valid) {
      this.logger.warn('[DestinationValidator] Update request validation failed');
      throw new ValidationError('Validation failed for update destination request', result.errors || []);
    }

    return result.data!;
  }
}
