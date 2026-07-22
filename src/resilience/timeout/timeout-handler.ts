import { TimeoutError } from '../errors/timeout-error';

/**
 * Execution wrapper racing promises against deadline timers and supporting fallback execution.
 */
export class TimeoutHandler {
  constructor(private readonly logger?: any) {}

  /**
   * Executes an asynchronous task, enforcing a maximum timeout duration limit.
   */
  public async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    operationName: string = 'AnonymousOperation'
  ): Promise<T> {
    if (timeoutMs <= 0) {
      return fn();
    }

    let timer: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        this.logger?.warn?.(`[TimeoutHandler] Operation "${operationName}" timed out after ${timeoutMs}ms`);
        reject(new TimeoutError(operationName, timeoutMs));
      }, timeoutMs);
    });

    try {
      return await Promise.race([fn(), timeoutPromise]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  /**
   * Executes an asynchronous task with timeout enforcement, returning a fallback default value if timed out or failed.
   */
  public async executeWithTimeoutAndFallback<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    fallback: () => T,
    operationName: string = 'AnonymousOperation'
  ): Promise<T> {
    try {
      return await this.executeWithTimeout(fn, timeoutMs, operationName);
    } catch (err: any) {
      this.logger?.warn?.(
        `[TimeoutHandler] Operation "${operationName}" failed or timed out (${err.message}). Executing fallback value...`
      );
      return fallback();
    }
  }
}
