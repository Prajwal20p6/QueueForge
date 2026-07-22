import { DomainError } from './domain-error';
import { ErrorCode } from '../../shared/constants/error-codes';

export class NotFoundError extends DomainError {
  public readonly entityType: string;
  public readonly entityId: string;

  constructor(entityType: string, entityId: string, context?: Record<string, any>) {
    super(
      `${entityType} with identifier "${entityId}" was not found.`,
      ErrorCode.NOT_FOUND,
      404,
      context || { entityType, entityId }
    );
    this.entityType = entityType;
    this.entityId = entityId;
  }

  public getEntityType(): string {
    return this.entityType;
  }

  public getEntityId(): string {
    return this.entityId;
  }
}
