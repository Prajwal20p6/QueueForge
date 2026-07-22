import { Destination } from '../../domain/entities/destination.entity';
import { DestinationType } from '../../domain/value-objects/destination-type';
import { IDestinationRepository } from '../../domain/repositories/IDestinationRepository';
import { RegisterDestinationDTO } from '../dtos/TaskResultDTO';

export class RegisterDestinationUseCase {
  constructor(private readonly destinationRepository: IDestinationRepository) {}

  public async execute(dto: RegisterDestinationDTO): Promise<Destination> {
    const type = dto.type === 'webhook' ? DestinationType.webhook() : DestinationType.database();

    const destination = Destination.create({
      endpointUrl: dto.config.url,
      destinationType: type,
      eventFilters: dto.config.filters ?? {},
    });

    return await this.destinationRepository.save(destination);
  }
}
