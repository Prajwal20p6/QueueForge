import { ResultFactory } from '../../../fixtures/factories/result.factory';
import { AiTaskResult } from '../../../../src/domain/entities/ai-task-result.entity';

describe('ResultFactory Unit Tests', () => {
  it('should create a single AiTaskResult with default values', () => {
    const result = ResultFactory.createOne();
    expect(result).toBeInstanceOf(AiTaskResult);
    expect(result.getId()).toBeDefined();
    expect(result.getEmailId()).toBe('test@oneinbox.ai');
    expect(result.getAgentId()).toBe('test-classifier-agent');
    expect(result.getConfidenceScore()).toBe(0.85);
  });

  it('should create many AiTaskResult entities with unique IDs', () => {
    const results = ResultFactory.createMany(5);
    expect(results).toHaveLength(5);
    const ids = results.map((r) => r.getId());
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(5);
  });

  it('should apply withEmailId() on static factory', () => {
    const result = ResultFactory.withEmailId('custom@domain.com').build();
    expect(result.getEmailId()).toBe('custom@domain.com');
  });

  it('should apply withConfidence() on static factory', () => {
    const result = ResultFactory.withConfidence(0.42).build();
    expect(result.getConfidenceScore()).toBe(0.42);
  });

  it('should apply withAgent() on static factory', () => {
    const result = ResultFactory.withAgent('specialized-agent').build();
    expect(result.getAgentId()).toBe('specialized-agent');
  });

  it('should support chained instance methods', () => {
    const result = ResultFactory
      .withEmailId('chain@test.com')
      .withAgent('chained-agent')
      .withAgentVersion('v9.9.9')
      .withConfidence(0.99)
      .build();

    expect(result.getEmailId()).toBe('chain@test.com');
    expect(result.getAgentId()).toBe('chained-agent');
    expect(result.getConfidenceScore()).toBe(0.99);
  });

  it('should throw a ValidationError on invalid email', () => {
    expect(() =>
      ResultFactory.withEmailId('not-an-email').build()
    ).toThrow();
  });

  it('should throw a ValidationError on out-of-bounds confidence score', () => {
    expect(() =>
      ResultFactory.withConfidence(1.5).build()
    ).toThrow();
  });

  it('should throw a ValidationError on negative confidence score', () => {
    expect(() =>
      ResultFactory.withConfidence(-0.1).build()
    ).toThrow();
  });

  it('should produce entities with domain events after creation', () => {
    const result = ResultFactory.createOne();
    const events = result.getDomainEvents();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]!.name).toBe('AiResultReceivedEvent');
  });

  it('should create many results with sequential email IDs', () => {
    const results = ResultFactory.createMany(3);
    expect(results[0]!.getEmailId()).toBe('test1@oneinbox.ai');
    expect(results[1]!.getEmailId()).toBe('test2@oneinbox.ai');
    expect(results[2]!.getEmailId()).toBe('test3@oneinbox.ai');
  });
});
