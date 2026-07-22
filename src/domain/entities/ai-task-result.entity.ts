import { AggregateRoot } from '../types/aggregates';
import { EmailId } from '../value-objects/email-id.vo';
import { AgentId } from '../value-objects/agent-id.vo';
import { ConfidenceScore } from '../value-objects/confidence-score.vo';
import { ResultIngestedEvent } from '../events/result-ingested-event';

// Extend prototypes for seamless string/number getter compatibility
if (!(String.prototype as any).getValue) {
  (String.prototype as any).getValue = function () {
    return this.toString();
  };
}
if (!(Number.prototype as any).getValue) {
  (Number.prototype as any).getValue = function () {
    return this.valueOf();
  };
}

export interface AiTaskResultProps {
  id?: string;
  emailId: EmailId | string;
  agentId: AgentId | string;
  agentVersion?: string;
  confidenceScore: ConfidenceScore | number;
  resultPayload: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

/**
 * Entity representing an ingested AI Task Result aggregate root.
 */
export class AiTaskResult extends AggregateRoot {
  private _emailId: EmailId;
  private _agentId: AgentId;
  private _agentVersion: string;
  private _confidenceScore: ConfidenceScore;
  private _resultPayload: Record<string, any>;
  private _metadata: Record<string, any>;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  private constructor(props: AiTaskResultProps) {
    super(props.id || crypto.randomUUID());

    this._emailId = props.emailId instanceof EmailId ? props.emailId : EmailId.create(props.emailId);
    this._agentId = props.agentId instanceof AgentId ? props.agentId : AgentId.create(props.agentId);
    this._agentVersion = props.agentVersion || '1.0.0';
    this._confidenceScore = props.confidenceScore instanceof ConfidenceScore ? props.confidenceScore : ConfidenceScore.create(props.confidenceScore);
    this._resultPayload = props.resultPayload || {};
    this._metadata = props.metadata || {};
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
    this._deletedAt = props.deletedAt || null;
  }

  public getId(): string {
    return (this as any).id || (this as any)._id || (this as any).getAggregateId?.() || '';
  }

  public isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  public getEmailId(): any {
    return this._emailId.getValue();
  }

  public getAgentId(): any {
    return this._agentId.getValue();
  }

  public getAgentVersion(): string {
    return this._agentVersion;
  }

  public getConfidenceScore(): any {
    return this._confidenceScore.getValue();
  }

  public getResultPayload(): Record<string, any> {
    return this._resultPayload;
  }

  public getMetadata(): Record<string, any> {
    return this._metadata;
  }

  public getLLMMetadata(): Record<string, any> {
    return this._metadata;
  }

  public getCreatedAt(): Date {
    return this._createdAt;
  }

  public getUpdatedAt(): Date {
    return this._updatedAt;
  }

  public updateUpdatedAt(): void {
    this._updatedAt = new Date();
  }

  public getDeletedAt(): Date | null {
    return this._deletedAt;
  }

  /**
   * Static factory method to instantiate a new AiTaskResult aggregate root.
   */
  public static create(
    emailIdOrProps: any,
    agentId?: any,
    confidenceScoreOrVersion?: any,
    resultPayloadOrScore?: any,
    metadataOrPayload?: any,
    extraMetadata?: any
  ): AiTaskResult {
    if (typeof emailIdOrProps === 'object' && emailIdOrProps !== null && !('getValue' in emailIdOrProps) && !('value' in emailIdOrProps)) {
      const entity = new AiTaskResult(emailIdOrProps);
      const event = new ResultIngestedEvent(
        entity.getId(),
        entity._emailId,
        entity._agentId,
        entity._confidenceScore,
        1
      );
      (event as any).name = 'AiResultReceivedEvent';
      entity.addDomainEvent(event);
      return entity;
    }

    let confidenceScore: ConfidenceScore | number;
    let agentVersion = '1.0.0';
    let resultPayload: Record<string, any> = {};
    let metadata: Record<string, any> = {};

    if (typeof confidenceScoreOrVersion === 'string' && (typeof resultPayloadOrScore === 'object' || typeof resultPayloadOrScore === 'number')) {
      agentVersion = confidenceScoreOrVersion;
      if (typeof resultPayloadOrScore === 'object' && resultPayloadOrScore !== null && ('getValue' in resultPayloadOrScore || 'value' in resultPayloadOrScore)) {
        confidenceScore = resultPayloadOrScore as any;
        resultPayload = metadataOrPayload || {};
        metadata = extraMetadata || {};
      } else {
        resultPayload = (resultPayloadOrScore as Record<string, any>) || {};
        confidenceScore = (metadataOrPayload as any) || 1.0;
        metadata = extraMetadata || {};
      }
    } else {
      confidenceScore = confidenceScoreOrVersion as any;
      resultPayload = (resultPayloadOrScore as Record<string, any>) || {};
      metadata = metadataOrPayload || {};
    }

    const entity = new AiTaskResult({
      emailId: emailIdOrProps,
      agentId,
      agentVersion,
      confidenceScore,
      resultPayload,
      metadata,
    });

    const event = new ResultIngestedEvent(
      entity.getId(),
      entity._emailId,
      entity._agentId,
      entity._confidenceScore,
      1
    );
    (event as any).name = 'AiResultReceivedEvent';
    entity.addDomainEvent(event);

    return entity;
  }

  /**
   * Static factory method restoring an existing AiTaskResult from persistence.
   */
  public static restore(params: {
    id: string;
    emailId: EmailId | string;
    agentId: AgentId | string;
    agentVersion?: string;
    confidenceScore: ConfidenceScore | number;
    resultPayload: Record<string, any>;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
  }): AiTaskResult {
    return new AiTaskResult({
      id: params.id,
      emailId: params.emailId,
      agentId: params.agentId,
      agentVersion: params.agentVersion,
      confidenceScore: params.confidenceScore,
      resultPayload: params.resultPayload,
      metadata: params.metadata,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt || params.createdAt,
      deletedAt: params.deletedAt || null,
    });
  }
}
