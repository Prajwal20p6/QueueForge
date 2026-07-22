import { DomainEvent } from './domain-event';
import { EmailId } from '../value-objects/email-id.vo';
import { AgentId } from '../value-objects/agent-id.vo';
import { ConfidenceScore } from '../value-objects/confidence-score.vo';

/**
 * Domain Event emitted when an AI Task Result package is successfully ingested.
 */
export class ResultIngestedEvent extends DomainEvent {
  public readonly resultId: string;
  public readonly emailId: EmailId;
  public readonly agentId: AgentId;
  public readonly confidenceScore: ConfidenceScore;
  public readonly destinationCount: number;

  constructor(
    resultId: string,
    emailId: EmailId,
    agentId: AgentId,
    confidenceScore: ConfidenceScore,
    destinationCount: number
  ) {
    super(resultId, 'AiTaskResult', 'RESULT_INGESTED', 1);
    this.resultId = resultId;
    this.emailId = emailId;
    this.agentId = agentId;
    this.confidenceScore = confidenceScore;
    this.destinationCount = destinationCount;
  }

  public override toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      resultId: this.resultId,
      emailId: this.emailId.getValue(),
      agentId: this.agentId.getValue(),
      confidenceScore: this.confidenceScore.getValue(),
      destinationCount: this.destinationCount,
    };
  }
}
