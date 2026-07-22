import { AgentId } from '../../../../src/domain/value-objects/agent-id';
import { ValidationError } from '../../../../src/domain/errors/validation-error';

describe('AgentId Value Object Unit Tests', () => {
  it('should successfully create a valid AgentId', () => {
    const agent = AgentId.create('spam-classifier_v2');
    expect(agent.getValue()).toBe('spam-classifier_v2');
    expect(agent.toString()).toBe('spam-classifier_v2');
  });

  it('should throw ValidationError on invalid characters', () => {
    const invalidIds = ['agent name with spaces', 'agent#special', 'agent/path'];

    invalidIds.forEach(id => {
      expect(() => {
        AgentId.create(id);
      }).toThrow(ValidationError);
    });
  });

  it('should throw ValidationError if length is out of range 1-255', () => {
    expect(() => {
      AgentId.create('');
    }).toThrow(ValidationError);

    const overlyLongId = 'a'.repeat(256);
    expect(() => {
      AgentId.create(overlyLongId);
    }).toThrow(ValidationError);
  });

  it('should evaluate value equality correctly', () => {
    const agent1 = AgentId.create('id-1');
    const agent2 = AgentId.create('id-1');
    const agent3 = AgentId.create('id-2');

    expect(agent1.equals(agent2)).toBe(true);
    expect(agent1.equals(agent3)).toBe(false);
  });
});
