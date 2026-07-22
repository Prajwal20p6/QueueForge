/**
 * Orchestrates graceful worker shutdown sequences draining active queue workers before process exit.
 */
export class GracefulShutdown {
  private shuttingDown = false;

  constructor(
    private readonly jobProcessor: any,
    private readonly heartbeat?: any,
    private readonly logger?: any,
    _config?: any
  ) {}

  public isShuttingDown(): boolean {
    return this.shuttingDown;
  }

  /**
   * Begins graceful shutdown process.
   */
  public async initiate(): Promise<void> {
    if (this.shuttingDown) return;
    this.shuttingDown = true;
    this.logger?.info?.('[GracefulShutdown] Initiating graceful worker shutdown sequence...');

    try {
      if (this.jobProcessor && typeof this.jobProcessor.stop === 'function') {
        await this.jobProcessor.stop();
      }

      if (this.heartbeat && typeof this.heartbeat.stop === 'function') {
        await this.heartbeat.stop();
      }

      this.logger?.info?.('[GracefulShutdown] Graceful worker shutdown completed cleanly.');
    } catch (err: any) {
      this.logger?.error?.(`[GracefulShutdown] Error during shutdown sequence: ${err.message}`);
    }
  }

  public async shutdown(): Promise<void> {
    await this.initiate();
  }

  public async waitForCompletion(timeoutMs: number = 60000): Promise<void> {
    const start = Date.now();
    await this.initiate();
    while (this.jobProcessor?.getStats?.()?.activeJobs > 0 && Date.now() - start < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  public abort(): void {
    this.shuttingDown = false;
    this.logger?.warn?.('[GracefulShutdown] Shutdown sequence aborted.');
  }

  /**
   * Registers SIGINT and SIGTERM OS signal listeners to trigger graceful shutdown automatically.
   */
  public registerSignalHandlers(): void {
    const handleSignal = async (signal: string) => {
      this.logger?.info?.(`[GracefulShutdown] Received ${signal} signal`);
      await this.initiate();
      process.exit(0);
    };

    process.once('SIGINT', () => handleSignal('SIGINT'));
    process.once('SIGTERM', () => handleSignal('SIGTERM'));
  }
}

// Backward compatibility alias
export { GracefulShutdown as GracefulShutdownHandler };
