import {
  AiTaskResultBuilder,
  DestinationBuilder,
  DeliveryBuilder,
  createAiTaskResult,
  createDestination,
  createDelivery,
} from '../../factories/entity-builders';
import { IngestResultRequestBuilder, CreateDestinationRequestBuilder } from '../../factories/dto-builders';

describe('Factory Builders Unit Tests', () => {
  it('should build valid AiTaskResult entity using builder pattern', () => {
    const result = new AiTaskResultBuilder()
      .withEmailId('custom@example.com')
      .withAgentId('agent-123')
      .withConfidenceScore(0.99)
      .build();

    expect(result.emailId).toBe('custom@example.com');
    expect(result.agentId).toBe('agent-123');
    expect(result.confidenceScore).toBe(0.99);
  });

  it('should build valid Destination entity using builder pattern', () => {
    const dest = new DestinationBuilder()
      .withType('WEBHOOK')
      .withEndpoint('https://api.example.com/hook')
      .enabled(true)
      .build();

    expect(dest.type).toBe('WEBHOOK');
    expect(dest.endpoint).toBe('https://api.example.com/hook');
    expect(dest.enabled).toBe(true);
  });

  it('should build valid Delivery entity using builder pattern', () => {
    const del = new DeliveryBuilder().withStatus('COMPLETED').build();
    expect(del.status).toBe('COMPLETED');
  });

  it('should construct entities using factory helper functions with overrides', () => {
    const taskResult = createAiTaskResult({ agentId: 'override-agent' });
    expect(taskResult.agentId).toBe('override-agent');

    const dest = createDestination({ enabled: false });
    expect(dest.enabled).toBe(false);

    const delivery = createDelivery({ retryCount: 3 });
    expect(delivery.retryCount).toBe(3);
  });

  it('should construct DTO objects using DTO builders', () => {
    const ingestReq = new IngestResultRequestBuilder().withEmailId('dto@example.com').build();
    expect(ingestReq.emailId).toBe('dto@example.com');

    const destReq = new CreateDestinationRequestBuilder().withEndpoint('https://example.com').build();
    expect(destReq.endpoint).toBe('https://example.com');
  });
});
