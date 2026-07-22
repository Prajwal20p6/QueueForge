import { AsyncLocalStorage } from 'async_hooks';

const correlationStorage = new AsyncLocalStorage<Map<string, string>>();

/**
 * Utility class correlating request traces logs execution variables.
 */
export class LogCorrelator {
  /**
   * Runs target closure context registering correlation IDs.
   */
  public static runWithContext<T>(correlationId: string, fn: () => T): T {
    const contextMap = new Map<string, string>();
    contextMap.set('correlationId', correlationId);
    return correlationStorage.run(contextMap, fn);
  }

  /**
   * Fetches current trace ID from thread context storage.
   */
  public static getCorrelationId(): string | undefined {
    const store = correlationStorage.getStore();
    return store?.get('correlationId');
  }
}
