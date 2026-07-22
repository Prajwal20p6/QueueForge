import { Delivery } from '../entities/delivery.entity';

export interface IDeliveryLogRepository {
  save(log: Delivery): Promise<Delivery>;
  findByTaskResultId(taskResultId: string): Promise<Delivery[]>;
  findByDestinationId(destinationId: string): Promise<Delivery[]>;
  findAll(): Promise<Delivery[]>;
  findStale(staleThreshold: Date): Promise<Delivery[]>;
  findByStatus(status: string): Promise<Delivery[]>;
}
