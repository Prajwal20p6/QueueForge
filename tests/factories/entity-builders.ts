import { FACTORY_DEFAULTS } from './factory-defaults';
import { RandomData } from './random-data';

export class AiTaskResultBuilder {
  private data = {
    id: RandomData.randomUUID(),
    emailId: FACTORY_DEFAULTS.aiTaskResult.emailId,
    agentId: FACTORY_DEFAULTS.aiTaskResult.agentId,
    agentVersion: FACTORY_DEFAULTS.aiTaskResult.agentVersion,
    confidenceScore: FACTORY_DEFAULTS.aiTaskResult.confidenceScore,
    payload: FACTORY_DEFAULTS.aiTaskResult.payload,
    llmMetadata: FACTORY_DEFAULTS.aiTaskResult.llmMetadata,
    createdAt: new Date(),
  };

  public withEmailId(emailId: string): this {
    this.data.emailId = emailId;
    return this;
  }

  public withAgentId(agentId: string): this {
    this.data.agentId = agentId;
    return this;
  }

  public withConfidenceScore(score: number): this {
    this.data.confidenceScore = score;
    return this;
  }

  public build() {
    return { ...this.data };
  }
}

export class DestinationBuilder {
  private data = {
    id: RandomData.randomUUID(),
    type: FACTORY_DEFAULTS.destination.type,
    endpoint: FACTORY_DEFAULTS.destination.endpoint,
    config: FACTORY_DEFAULTS.destination.config,
    enabled: FACTORY_DEFAULTS.destination.enabled,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  public withType(type: any): this {
    this.data.type = type;
    return this;
  }

  public withEndpoint(endpoint: string): this {
    this.data.endpoint = endpoint;
    return this;
  }

  public enabled(enabled: boolean): this {
    this.data.enabled = enabled;
    return this;
  }

  public build() {
    return { ...this.data };
  }
}

export class DeliveryBuilder {
  private data = {
    id: RandomData.randomUUID(),
    taskResultId: RandomData.randomUUID(),
    destinationId: RandomData.randomUUID(),
    status: FACTORY_DEFAULTS.delivery.status,
    retryCount: FACTORY_DEFAULTS.delivery.retryCount,
    nextRetryAt: FACTORY_DEFAULTS.delivery.nextRetryAt,
    lastAttemptAt: FACTORY_DEFAULTS.delivery.lastAttemptAt,
    lastError: FACTORY_DEFAULTS.delivery.lastError,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  public withTaskResultId(id: string): this {
    this.data.taskResultId = id;
    return this;
  }

  public withDestinationId(id: string): this {
    this.data.destinationId = id;
    return this;
  }

  public withStatus(status: any): this {
    this.data.status = status;
    return this;
  }

  public build() {
    return { ...this.data };
  }
}

export function createAiTaskResult(overrides: any = {}) {
  return { ...new AiTaskResultBuilder().build(), ...overrides };
}

export function createDestination(overrides: any = {}) {
  return { ...new DestinationBuilder().build(), ...overrides };
}

export function createDelivery(overrides: any = {}) {
  return { ...new DeliveryBuilder().build(), ...overrides };
}
