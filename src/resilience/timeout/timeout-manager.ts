/**
 * Registry holding per-operation timeout limit configurations for QueueForge external dependencies.
 */
export class TimeoutManager {
  private readonly timeouts: Map<string, number> = new Map();

  constructor(
    config?: any,
    private readonly logger?: any
  ) {
    // Register default operation timeouts
    this.timeouts.set('http', config?.timeout?.http ?? 30000);
    this.timeouts.set('database', config?.timeout?.database ?? 60000);
    this.timeouts.set('redis', config?.timeout?.redis ?? 10000);
    this.timeouts.set('queue', config?.timeout?.queue ?? 30000);
  }

  public getTimeout(operation: string): number {
    const timeout = this.timeouts.get(operation.toLowerCase());
    if (timeout !== undefined) {
      return timeout;
    }
    return 30000; // Default fallback 30s
  }

  public setCustomTimeout(operation: string, timeoutMs: number): void {
    if (timeoutMs <= 0) {
      throw new Error('Timeout value must be greater than 0');
    }
    const op = operation.toLowerCase();
    this.timeouts.set(op, timeoutMs);
    this.logger?.debug?.(`[TimeoutManager] Updated custom timeout for operation "${op}" to ${timeoutMs}ms`);
  }

  public getAll(): Map<string, number> {
    return new Map(this.timeouts);
  }
}
