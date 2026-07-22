import { Validator } from '../../security/validation/validator';
import { IngestResultRequestSchema } from '../../security/validation/zod-schemas';
import { IngestResultRequest } from '../../application/dto/ingestion.dto';
import { ValidationError } from '../../shared/errors/validation-error';
import { Logger } from '../../observability/logging/logger';

/**
 * Validator class verifying AI task ingestion payload requests against standard Zod schemas.
 */
export class ResultValidator {
  private readonly validator: Validator;
  private readonly logger: Logger;

  constructor(validator: Validator, logger: Logger) {
    this.validator = validator;
    this.logger = logger;
  }

  /**
   * Validates result ingestion request payload and parses the request DTO.
   */
  public async validateIngestRequest(req: any): Promise<IngestResultRequest> {
    const result = this.validator.validate<IngestResultRequest>(IngestResultRequestSchema, req);

    if (!result.valid) {
      this.logger.warn('[ResultValidator] Ingestion payload validation failed');
      throw new ValidationError('Validation failed for task result ingestion request', result.errors || []);
    }

    return result.data!;
  }
}
