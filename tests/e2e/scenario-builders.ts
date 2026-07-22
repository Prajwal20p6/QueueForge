import { createAiTaskResult, createDestination } from '../factories/entity-builders';

export class ScenarioBuilder {
  public static buildHappyPathScenario() {
    return {
      result: createAiTaskResult(),
      destination: createDestination(),
    };
  }

  public static buildRetryScenario() {
    return {
      result: createAiTaskResult(),
      destination: createDestination({ endpoint: 'https://httpbin.org/status/500' }),
    };
  }
}
