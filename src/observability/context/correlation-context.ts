import { AsyncLocalStorage } from 'async_hooks';
import { LogContext } from '../logging/log-context';

const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

/**
 * Thread-safe context store backed by Node.js AsyncLocalStorage for propagating correlation and log context.
 */
export class CorrelationContext {
  /**
   * Sets context in async storage.
   */
  public static set(context: Partial<LogContext> | LogContext): void {
    const current = asyncLocalStorage.getStore() || new LogContext();
    const merged = current.with(context instanceof LogContext ? context.toJSON() : context);
    asyncLocalStorage.enterWith(merged);
  }

  /**
   * Retrieves active context from async storage.
   */
  public static get(): LogContext {
    return asyncLocalStorage.getStore() || new LogContext();
  }

  /**
   * Merges partial context into active async context store.
   */
  public static merge(partial: Partial<LogContext> | Record<string, any>): void {
    const current = asyncLocalStorage.getStore() || new LogContext();
    const merged = current.with(partial);
    asyncLocalStorage.enterWith(merged);
  }

  /**
   * Clears active async context store.
   */
  public static clear(): void {
    asyncLocalStorage.enterWith(new LogContext());
  }

  /**
   * Runs callback function within isolated AsyncLocalStorage context.
   */
  public static run<T>(context: Partial<LogContext> | LogContext, fn: () => T): T {
    const logCtx = context instanceof LogContext ? context : new LogContext(context);
    return asyncLocalStorage.run(logCtx, fn);
  }
}
