import { DomainError } from './domain-error';
import { ErrorCode } from '../../shared/constants/error-codes';

export class StateError extends DomainError {
  public readonly currentState: string;
  public readonly attemptedTransition: string;

  constructor(currentStateOrMsg: string, attemptedTransition?: string, messageOrContext?: any) {
    const currentState = currentStateOrMsg;
    const transition = attemptedTransition || '';
    const msg = typeof messageOrContext === 'string'
      ? messageOrContext
      : (transition ? `State error: cannot transition from ${currentState} to ${transition}` : currentStateOrMsg);

    const ctx = typeof messageOrContext === 'object' ? messageOrContext : { currentState, attemptedTransition: transition };

    super(msg, ErrorCode.DELIVERY_FAILED, 400, ctx);
    this.currentState = currentState;
    this.attemptedTransition = transition;
  }

  public getCurrentState(): string {
    return this.currentState;
  }

  public getAttemptedTransition(): string {
    return this.attemptedTransition;
  }
}
