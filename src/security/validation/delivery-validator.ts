import { InputValidator } from './validators';
import { ValidationError } from '../../shared/errors/validation-error';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

/**
 * Security validator asserting rules and constraints on delivery retry requests.
 */
export class DeliveryValidator {
  constructor(_logger?: Logger | any) {}

  /**
   * Asserts valid delivery ID parameter format.
   */
  public validateDeliveryId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('deliveryId', 'Delivery ID is required.');
    }
    try {
      InputValidator.validateUUID(id, 'deliveryId');
    } catch {
      if (!/^[a-zA-Z0-9_-]{8,64}$/.test(id.trim())) {
        throw new ValidationError('deliveryId', `Invalid delivery ID parameter: "${id}"`);
      }
    }
  }

  /**
   * Asserts valid RetryDeliveryRequest parameters.
   */
  public validateRetryRequest(request: any): void {
    if (request && typeof request === 'object') {
      if (request.delayMs !== undefined && request.delayMs !== null) {
        if (typeof request.delayMs !== 'number' || request.delayMs < 0 || request.delayMs > 86400000) {
          throw new ValidationError('delayMs', 'Retry delayMs parameter must be a non-negative number under 86,400,000ms.');
        }
      }
    }
  }
}
