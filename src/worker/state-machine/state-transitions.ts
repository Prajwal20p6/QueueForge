export interface StateTransition {
  from: string;
  to: string;
  allowed: boolean;
  description: string;
}

export const VALID_DELIVERY_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PROCESSING'],
  PROCESSING: ['COMPLETED', 'SCHEDULED_RETRY', 'FAILED_DLQ'],
  SCHEDULED_RETRY: ['PENDING', 'PROCESSING'],
  COMPLETED: [],
  FAILED_DLQ: [],
};

/**
 * Validates whether a state transition path is allowed by state machine rules.
 */
export function isValidStateTransition(fromState: string, toState: string): boolean {
  const allowedNextStates = VALID_DELIVERY_TRANSITIONS[fromState.toUpperCase()];
  if (!allowedNextStates) return false;
  return allowedNextStates.includes(toState.toUpperCase());
}
