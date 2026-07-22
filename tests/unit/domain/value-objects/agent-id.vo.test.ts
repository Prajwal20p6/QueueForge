import { AgentId } from '../../../../src/domain/value-objects/agent-id.vo';
import { ValidationError } from '../../../../src/shared/errors/validation-error';

describe('AgentId Value Object Unit Tests', () => {
  it('should successfully create a valid AgentId instance', () => {
    const agent = AgentId.create('agent-gpt-4o');
    expect(agent.getValue()).toBe('agent-gpt-4o');
    expect(agent.toString()).toBe('agent-gpt-4o');
  });

  it('should throw ValidationError on empty or invalid characters in AgentId', () => {
    expect(() => new AgentId('')).toThrow(ValidationError);
    expect(() => AgentId.create('invalid agent id with spaces')).toThrow(ValidationError);
    expect(() => AgentId.create('agent@invalid!')).toThrow(ValidationError);
  });

  it('should compare equality accurately', () => {
    const agent1 = AgentId.create('agent-123');
    const agent2 = AgentId.create('agent-123');
    const agent3 = AgentId.create('agent-999');

    expect(agent1.equals(agent2)).toBe(true);
    expect(agent1.equals(agent3)).toBe(false);
    expect(agent1.equals(undefined as any)).toBe(false);
  });
});
