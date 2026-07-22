import { AiTaskResult } from '../../../src/domain/entities/ai-task-result.entity';

/**
 * Builder factory for creating AiTaskResult domain entities in tests.
 * Supports chained configuration methods and a terminal build() call.
 *
 * @example
 * ```typescript
 * const result = ResultFactory.withConfidence(0.95).withAgent('billing-agent').build();
 * const results = ResultFactory.createMany(5);
 * ```
 */
export class ResultFactory {
  private _emailId = 'test@oneinbox.ai';
  private _agentId = 'test-classifier-agent';
  private _agentVersion = 'v1.0.0';
  private _resultPayload: Record<string, unknown> = {
    category: 'general',
    summary: 'Test result payload',
    actionRequired: false,
  };
  private _confidenceScore = 0.85;

  private constructor() {}

  /**
   * Creates a single AiTaskResult entity with default values.
   */
  public static createOne(): AiTaskResult {
    return new ResultFactory().build();
  }

  /**
   * Creates an array of AiTaskResult entities with sequential email IDs.
   * @param count - Number of entities to create.
   */
  public static createMany(count: number): AiTaskResult[] {
    return Array.from({ length: count }, (_, i) =>
      new ResultFactory()
        .withEmailId(`test${i + 1}@oneinbox.ai`)
        .withAgent(`test-agent-${i + 1}`)
        .build()
    );
  }

  /**
   * Sets the email ID for the result entity.
   * @param emailId - Valid email address string.
   */
  public static withEmailId(emailId: string): ResultFactory {
    const factory = new ResultFactory();
    factory._emailId = emailId;
    return factory;
  }

  /**
   * Sets the confidence score for the result entity.
   * @param score - Confidence score between 0.0 and 1.0.
   */
  public static withConfidence(score: number): ResultFactory {
    const factory = new ResultFactory();
    factory._confidenceScore = score;
    return factory;
  }

  /**
   * Sets the agent ID for the result entity.
   * @param agentId - Agent identifier string.
   */
  public static withAgent(agentId: string): ResultFactory {
    const factory = new ResultFactory();
    factory._agentId = agentId;
    return factory;
  }

  /**
   * Sets the email ID on this factory instance (chainable).
   */
  public withEmailId(emailId: string): this {
    this._emailId = emailId;
    return this;
  }

  /**
   * Sets the confidence score on this factory instance (chainable).
   */
  public withConfidence(score: number): this {
    this._confidenceScore = score;
    return this;
  }

  /**
   * Sets the agent ID on this factory instance (chainable).
   */
  public withAgent(agentId: string): this {
    this._agentId = agentId;
    return this;
  }

  /**
   * Sets the agent version on this factory instance (chainable).
   */
  public withAgentVersion(version: string): this {
    this._agentVersion = version;
    return this;
  }

  /**
   * Sets the result payload on this factory instance (chainable).
   */
  public withPayload(payload: Record<string, unknown>): this {
    this._resultPayload = payload;
    return this;
  }

  /**
   * Builds and returns the configured AiTaskResult entity.
   */
  public build(): AiTaskResult {
    return AiTaskResult.create({
      emailId: this._emailId,
      agentId: this._agentId,
      agentVersion: this._agentVersion,
      resultPayload: this._resultPayload,
      confidenceScore: this._confidenceScore,
    });
  }
}
