import { FACTORY_DEFAULTS } from './factory-defaults';

export class IngestResultRequestBuilder {
  private data = {
    emailId: FACTORY_DEFAULTS.aiTaskResult.emailId,
    agentId: FACTORY_DEFAULTS.aiTaskResult.agentId,
    agentVersion: FACTORY_DEFAULTS.aiTaskResult.agentVersion,
    confidenceScore: FACTORY_DEFAULTS.aiTaskResult.confidenceScore,
    payload: FACTORY_DEFAULTS.aiTaskResult.payload,
    llmMetadata: FACTORY_DEFAULTS.aiTaskResult.llmMetadata,
  };

  public withEmailId(emailId: string): this {
    this.data.emailId = emailId;
    return this;
  }

  public withAgentId(agentId: string): this {
    this.data.agentId = agentId;
    return this;
  }

  public build() {
    return { ...this.data };
  }
}

export class CreateDestinationRequestBuilder {
  private data = {
    type: FACTORY_DEFAULTS.destination.type,
    endpoint: FACTORY_DEFAULTS.destination.endpoint,
    config: FACTORY_DEFAULTS.destination.config,
    enabled: FACTORY_DEFAULTS.destination.enabled,
  };

  public withType(type: any): this {
    this.data.type = type;
    return this;
  }

  public withEndpoint(endpoint: string): this {
    this.data.endpoint = endpoint;
    return this;
  }

  public build() {
    return { ...this.data };
  }
}
