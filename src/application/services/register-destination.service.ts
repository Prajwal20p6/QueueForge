import client from 'prom-client';
import { IDestinationRepository as DestinationRepository } from '../../domain/repositories/IDestinationRepository';
import { AuditContext, AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';
import { CreateDestinationRequest, DestinationResponse } from '../dto/destination.dto';
import { DestinationMapper } from '../mappers/destination-mapper';
import { ValidationError } from '../../shared/errors/validation-error';

// Register custom metrics counter
export const destinationsRegisteredCounter =
  (client.register.getSingleMetric('destinations_registered_total') as client.Counter) ||
  new client.Counter({
    name: 'destinations_registered_total',
    help: 'Total registered delivery destinations',
  });

/**
 * Service orchestrating new delivery route destination profile registrations.
 */
export class RegisterDestinationService {
  constructor(
    private readonly destinationRepository: DestinationRepository | any,
    private readonly logger?: Logger | any,
    _metrics?: any,
    _observability?: any
  ) {}

  /**
   * Validates endpoint format according to target type.
   */
  private validateEndpoint(type: string, endpoint: string): void {
    if (!endpoint || typeof endpoint !== 'string' || !endpoint.trim()) {
      throw new ValidationError('endpoint', 'Destination endpoint URL is required.');
    }

    const t = type.toUpperCase();
    if (t === 'WEBHOOK') {
      if (!/^https?:\/\/.+/i.test(endpoint)) {
        throw new ValidationError('endpoint', `Webhook destination endpoint must be a valid HTTP/HTTPS URL. Received: "${endpoint}"`);
      }
    }
  }

  /**
   * Validates endpoint parameters, creates a new Destination, and persists to storage.
   */
  public async register(
    request: CreateDestinationRequest,
    _context?: AuditContext
  ): Promise<DestinationResponse> {
    const typeStr = request.type || request.destinationType || 'WEBHOOK';
    const endpointStr = request.endpoint || request.endpointUrl || '';

    this.validateEndpoint(typeStr, endpointStr);

    this.logger?.info?.(`Registering new destination endpoint: ${endpointStr} (Type: ${typeStr})`);

    // Map request DTO parameters to domain entity
    const destination = DestinationMapper.toDomain(request);

    // Save to database
    const saved = await this.destinationRepository.save(destination);

    // Track metrics
    destinationsRegisteredCounter.inc();

    this.logger?.info?.(`Successfully registered destination "${saved.getId()}"`);

    return DestinationMapper.toResponse(saved);
  }
}
