import { InputValidator } from './validators';
import { CreateDestinationRequest } from '../../application/dto/destination.dto';
import { ValidationError } from '../../shared/errors/validation-error';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

/**
 * Security validator asserting rules and constraints on destination profile registrations.
 */
export class DestinationValidator {
  constructor(_logger?: Logger | any) {}

  /**
   * Asserts validity of endpoint connection strings according to destination category.
   */
  public validateEndpoint(endpoint: string, type: string = 'WEBHOOK'): void {
    if (!endpoint || typeof endpoint !== 'string' || !endpoint.trim()) {
      throw new ValidationError('endpoint', 'Destination endpoint URL is required.');
    }

    const t = String(type).toUpperCase();
    const ep = endpoint.trim();

    if (t === 'WEBHOOK') {
      if (!/^https?:\/\/.+/i.test(ep)) {
        throw new ValidationError('endpoint', `Webhook destination endpoint must be a valid HTTP/HTTPS URL. Received: "${endpoint}"`);
      }
      InputValidator.validateURL(ep, 'endpoint');
    } else if (t === 'DATABASE') {
      if (!/^(postgresql|postgres|mysql|mongodb|redis):\/\/.+/i.test(ep)) {
        throw new ValidationError('endpoint', `Database endpoint must be a valid connection string URL. Received: "${endpoint}"`);
      }
    } else if (t === 'QUEUE') {
      if (!/^[a-zA-Z0-9_-]{2,64}$/.test(ep)) {
        throw new ValidationError('endpoint', `Queue endpoint must be a valid alphanumeric queue name. Received: "${endpoint}"`);
      }
    } else if (t === 'AUDIT') {
      if (!/^[a-zA-Z0-9_.-]{2,64}$/.test(ep)) {
        throw new ValidationError('endpoint', `Audit destination must be a valid event namespace. Received: "${endpoint}"`);
      }
    }
  }

  /**
   * Asserts validity of event match filter objects.
   */
  public validateEventFilters(filters: Record<string, any>): void {
    if (filters && typeof filters !== 'object') {
      throw new ValidationError('eventFilters', 'Event filters must be a valid JSON key-value object.');
    }
  }

  /**
   * Asserts validity of retry strategy parameters.
   */
  public validateRetryStrategy(strategy: Record<string, any>): void {
    if (!strategy || typeof strategy !== 'object') {
      throw new ValidationError('retryStrategy', 'Retry strategy configuration must be an object.');
    }
    const validTypes = ['EXPONENTIAL', 'FIXED', 'LINEAR', 'NONE'];
    if (strategy.type && !validTypes.includes(String(strategy.type).toUpperCase())) {
      throw new ValidationError('retryStrategy.type', `Invalid retry strategy type: "${strategy.type}"`);
    }
  }

  /**
   * Asserts circuit breaker threshold bounds [1, 100].
   */
  public validateCircuitBreakerThreshold(threshold: number): void {
    if (threshold !== undefined && threshold !== null) {
      if (typeof threshold !== 'number' || threshold < 1 || threshold > 100) {
        throw new ValidationError('circuitBreakerThreshold', 'Circuit breaker threshold must be a number between 1 and 100.');
      }
    }
  }

  /**
   * Asserts HTTP execution timeout duration bounds [100ms, 300,000ms].
   */
  public validateTimeout(timeout: number): void {
    if (timeout !== undefined && timeout !== null) {
      if (typeof timeout !== 'number' || timeout < 100 || timeout > 300000) {
        throw new ValidationError('timeout', 'Execution timeout must be a duration in milliseconds between 100ms and 300000ms.');
      }
    }
  }

  /**
   * Validates full CreateDestinationRequest body.
   */
  public validateCreateRequest(request: any): CreateDestinationRequest {
    if (!request || typeof request !== 'object') {
      throw new ValidationError('request', 'Create destination request body is required.');
    }

    const typeStr = request.type || request.destinationType || 'WEBHOOK';
    const endpointStr = request.endpoint || request.endpointUrl || '';

    this.validateEndpoint(endpointStr, typeStr);

    if (request.eventFilters) {
      this.validateEventFilters(request.eventFilters);
    }

    if (request.retryStrategy) {
      this.validateRetryStrategy(request.retryStrategy);
    }

    this.validateCircuitBreakerThreshold(request.circuitBreakerThreshold);
    this.validateTimeout(request.timeout);

    return request as CreateDestinationRequest;
  }
}
