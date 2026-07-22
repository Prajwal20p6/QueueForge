import { createTestObservability } from '../helpers/test-observability';

export class MockObservabilityFactory {
  public static createMockObservabilityContext(): any {
    return createTestObservability();
  }
}
