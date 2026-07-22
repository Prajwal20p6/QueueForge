export interface Postmortem {
  incidentId: string;
  rootCause: string;
  resolutionSteps: string[];
  lessonsLearned: string[];
}

/**
 * Report helper generating postmortem templates.
 */
export class IncidentPostmortem {
  /**
   * Generates postmortem reports block.
   */
  public generate(incidentId: string, rootCause: string): Postmortem {
    return {
      incidentId,
      rootCause,
      resolutionSteps: ['Acknowledged incident alerts', 'Identified database lock bottleneck', 'Restarted worker pods'],
      lessonsLearned: ['Optimize transaction isolation locks', 'Add circuit breakers alerts'],
    };
  }
}
