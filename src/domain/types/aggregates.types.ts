import { AiTaskResult } from '../entities/ai-task-result.entity';
import { Delivery } from '../entities/delivery.entity';

export type AggregateIdentifier = string;

/**
 * Abstract class representing Domain Aggregate Roots.
 * Stores transactional changes, aggregate identity, and accumulates Domain Events.
 */
export abstract class AggregateRoot {
  protected readonly id: string;
  protected readonly createdAt: Date;
  protected deletedAt: Date | null;
  private domainEvents: any[] = [];

  public context?: {
    actorId?: string;
    reason?: string;
  };

  constructor(id: string, createdAt = new Date(), deletedAt: Date | null = null) {
    this.id = id;
    this.createdAt = createdAt;
    this.deletedAt = deletedAt;
  }

  public getId(): string {
    return this.id;
  }

  public getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  public isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  public delete(): void {
    this.deletedAt = new Date();
  }

  public equals(other: AggregateRoot): boolean {
    if (other === null || other === undefined) return false;
    if (Object.getPrototypeOf(this) !== Object.getPrototypeOf(other)) return false;
    return this.id === other.id;
  }

  public addDomainEvent(event: any): void {
    this.domainEvents.push(event);
  }

  public clearDomainEvents(): void {
    this.domainEvents = [];
  }

  public getDomainEvents(): any[] {
    return [...this.domainEvents];
  }
}

/**
 * Domain Aggregate Root composing an AI Task Result with its target Delivery entity set.
 */
export interface AiTaskResultAggregate {
  result: AiTaskResult;
  deliveries: Delivery[];
}
