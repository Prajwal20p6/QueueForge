import { createAiTaskResult } from '../factories/entity-builders';

export class AiTaskResultFixtures {
  public static highConfidenceResult() {
    return createAiTaskResult({ confidenceScore: 0.99 });
  }

  public static lowConfidenceResult() {
    return createAiTaskResult({ confidenceScore: 0.15 });
  }

  public static multipleResults(count: number) {
    return Array.from({ length: count }, (_, i) =>
      createAiTaskResult({ emailId: `user_${i}@example.com` })
    );
  }
}
