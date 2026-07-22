import { createAiTaskResult } from '../factories/entity-builders';

export class CommonIntegrationScenarios {
  public static async resultIngestedScenario() {
    return {
      payload: createAiTaskResult(),
    };
  }
}
