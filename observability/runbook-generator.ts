/**
 * Runbook Generator helper creating links and diagnostics instructions.
 */
export class RunbookGenerator {
  /**
   * Generates step guides resolving specific alerts names.
   */
  public generate(alertName: string): { symptoms: string; runbookUrl: string } {
    return {
      symptoms: `Diagnosing high metrics triggering: ${alertName}`,
      runbookUrl: `https://wiki.oneinbox.ai/runbooks/queueforge/${alertName.toLowerCase()}`,
    };
  }
}
