import { AiTaskResult } from '../../../../src/domain/entities/ai-task-result.entity';
import { EmailId } from '../../../../src/domain/value-objects/email-id.vo';
import { AgentId } from '../../../../src/domain/value-objects/agent-id.vo';
import { ConfidenceScore } from '../../../../src/domain/value-objects/confidence-score.vo';

describe('AiTaskResult Entity Unit Tests', () => {
  it('should instantiate AiTaskResult entity and expose valid properties', () => {
    const email = EmailId.create('agent.owner@example.com');
    const agent = AgentId.create('agent-summary-v1');
    const confidence = ConfidenceScore.create(0.92);

    const result = AiTaskResult.create(
      email,
      agent,
      '1.0.0',
      { outputText: 'Analysis summary complete.' },
      confidence,
      { model: 'gpt-4o', tokens: 420 }
    );

    expect(result.getId()).toBeDefined();
    expect(result.getEmailId().getValue()).toBe('agent.owner@example.com');
    expect(result.getAgentId().getValue()).toBe('agent-summary-v1');
    expect(result.getAgentVersion()).toBe('1.0.0');
    expect(result.getResultPayload().outputText).toBe('Analysis summary complete.');
    expect(result.getConfidenceScore().getValue()).toBe(0.92);
    expect(result.getLLMMetadata().model).toBe('gpt-4o');
  });

  it('should update timestamp when updateUpdatedAt is invoked', () => {
    const email = EmailId.create('user@test.com');
    const agent = AgentId.create('agent-1');
    const result = AiTaskResult.create(email, agent, '1.0', {}, ConfidenceScore.create(0.8), {});
    const origUpdated = result.getUpdatedAt().getTime();

    result.updateUpdatedAt();
    expect(result.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(origUpdated);
  });
});
