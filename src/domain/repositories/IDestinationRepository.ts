import { Destination } from '../entities/destination.entity';

export interface IDestinationRepository {
  save(destination: Destination): Promise<Destination>;
  findById(id: string): Promise<Destination | null>;
  findAllActive(): Promise<Destination[]>;
  findAll(): Promise<Destination[]>;
  update(destination: Destination): Promise<Destination>;
}
