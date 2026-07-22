/**
 * Handler catching process termination signals (SIGTERM, SIGINT, SIGHUP) and delegating to shutdown callback.
 */
export class SignalHandler {
  private readonly boundSigterm: () => void;
  private readonly boundSigint: () => void;
  private readonly boundSighup: () => void;

  constructor(
    private readonly logger?: any,
    private readonly callback?: () => Promise<void>
  ) {
    this.boundSigterm = () => this.handleSignal('SIGTERM');
    this.boundSigint = () => this.handleSignal('SIGINT');
    this.boundSighup = () => this.handleSignal('SIGHUP');
  }

  /**
   * Registers signal listeners.
   */
  public setup(): void {
    process.on('SIGTERM', this.boundSigterm);
    process.on('SIGINT', this.boundSigint);
    process.on('SIGHUP', this.boundSighup);
    this.logger?.debug?.('[SignalHandler] Registered SIGTERM, SIGINT, SIGHUP signal listeners.');
  }

  /**
   * Unregisters signal listeners.
   */
  public teardown(): void {
    process.removeListener('SIGTERM', this.boundSigterm);
    process.removeListener('SIGINT', this.boundSigint);
    process.removeListener('SIGHUP', this.boundSighup);
    this.logger?.debug?.('[SignalHandler] Unregistered signal listeners.');
  }

  private handleSignal(signal: string): void {
    this.logger?.info?.(`[SignalHandler] Signal ${signal} received. Initiating graceful shutdown...`);
    if (this.callback) {
      this.callback().catch(err => {
        this.logger?.error?.(`[SignalHandler] Error executing shutdown callback on ${signal}: ${err.message}`);
      });
    }
  }
}
