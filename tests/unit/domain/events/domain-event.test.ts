import { DomainEvent } from '../../../../src/domain/events/domain-event';
import { ResultIngestedEvent } from '../../../../src/domain/events/result-ingested-event';
import { EmailId } from '../../../../src/domain/value-objects/email-id.vo';
import { AgentId } from '../../../../src/domain/value-objects/agent-id.vo';
import { ConfidenceScore } from '../../../../src/domain/value-objects/confidence-score.vo';

describe('DomainEvent Abstract Base Class Unit Tests', () => {
  it('should initialize event metadata and serialize to JSON format', () => {
    const event = new ResultIngestedEvent(
      'res-uuid-1',
      EmailId.create('test@domain.com'),
      AgentId.create('agent-x'),
      ConfidenceScore.create(0.95),
      3
    );

    expect(event).toBeInstanceOf(DomainEvent);
    expect(event.getId()).toBeDefined();
    expect(event.getAggregateId()).toBe('res-uuid-1');
    expect(event.getAggregateType()).toBe('AiTaskResult');
    expect(event.getEventType()).toBe('RESULT_INGESTED');
    expect(event.getVersion()).toBe(1);

    const json = event.toJSON();
    expect(json.resultId).toBe('res-uuid-1');
    expect(json.emailId).toBe('test@domain.com');
    expect(json.agentId).toBe('agent-x');
    expect(json.confidenceScore).toBe(0.95);
    expect(json.destinationCount).toBe(3);
  });
});
