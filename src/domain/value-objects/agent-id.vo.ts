import { ValidationError } from '../errors/validation-error';

/**
 * Immutable Value Object representing an AI agent identifier.
 */
export class AgentId {
  public readonly value: string;

  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('Agent ID must be a non-empty string.');
    }

    const trimmed = value.trim();
    if (trimmed.length < 1 || trimmed.length > 255) {
      throw new ValidationError(`Agent ID length must be between 1 and 255 characters. Received ${trimmed.length}.`);
    }

    const agentIdRegex = /^[a-zA-Z0-9\-_.]+$/;
    if (!agentIdRegex.test(trimmed)) {
      throw new ValidationError(`Invalid Agent ID format: "${value}". Must contain only alphanumeric characters and hyphens.`);
    }

    this.value = trimmed;
    Object.freeze(this);
  }

  /**
   * Retrieves the raw string value of the AgentId.
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * Compares equality with another AgentId value object.
   */
  public equals(other: AgentId): boolean {
    if (!other || !(other instanceof AgentId)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Serializes the AgentId to string.
   */
  public toString(): string {
    return this.value;
  }

  public valueOf(): string {
    return this.value;
  }

  /**
   * Static factory method for creating and validating an AgentId instance.
   */
  public static create(id: string): AgentId {
    return new AgentId(id);
  }
}
