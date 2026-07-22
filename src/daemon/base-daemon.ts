export interface DaemonStatus {
  name: string;
  running: boolean;
  lastRun: Date | null;
  nextRun: Date | null;
  lastDurationMs?: number;
}

/**
 * Abstract base class for all QueueForge background daemons managing periodic execution loops, status reporting, and safety error handling.
 */
export abstract class BaseDaemon {
  public readonly name: string;
  public readonly interval: number; // in milliseconds
  protected running: boolean = false;
  protected lastRun: Date | null = null;
  protected lastDurationMs: number = 0;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    name: string,
    interval: number = 30000,
    protected readonly logger?: any,
    protected readonly observability?: any
  ) {
    this.name = name;
    this.interval = Math.max(100, interval);
  }

  /**
   * Executes a single daemon work cycle. Implemented by subclasses.
   */
  public abstract execute(): Promise<void>;

  /**
   * Begins the daemon background loop.
   */
  public async start(): Promise<void> {
    if (this.running) {
      this.logger?.debug?.(`[BaseDaemon:${this.name}] Daemon loop is already running.`);
      return;
    }

    this.running = true;
    this.logger?.info?.(`[BaseDaemon:${this.name}] Starting background daemon (interval=${this.interval}ms)`);

    // Run first cycle immediately
    this.runCycle().catch(() => {});

    this.timer = setInterval(() => {
      this.runCycle().catch(() => {});
    }, this.interval);

    if (this.timer && typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }

  /**
   * Gracefully stops the daemon background loop.
   */
  public async stop(): Promise<void> {
    if (!this.running) return;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.running = false;
    this.logger?.info?.(`[BaseDaemon:${this.name}] Daemon background loop stopped cleanly.`);
  }

  /**
   * Returns true if the daemon is currently running.
   */
  public isRunning(): boolean {
    return this.running;
  }

  /**
   * Returns runtime status details of this daemon.
   */
  public getStatus(): DaemonStatus {
    const nextRun = this.running && this.lastRun ? new Date(this.lastRun.getTime() + this.interval) : null;
    return {
      name: this.name,
      running: this.running,
      lastRun: this.lastRun,
      nextRun,
      lastDurationMs: this.lastDurationMs,
    };
  }

  /**
   * Runs a single execution cycle safely wrapped in error catch handlers and performance timers.
   */
  private async runCycle(): Promise<void> {
    const start = Date.now();
    this.lastRun = new Date();

    try {
      this.logger?.debug?.(`[BaseDaemon:${this.name}] Starting cycle execution...`);
      await this.execute();
      this.lastDurationMs = Date.now() - start;

      const threshold = this.interval * 0.8;
      if (this.lastDurationMs > threshold) {
        this.logger?.warn?.(
          `[BaseDaemon:${this.name}] Execution cycle took ${this.lastDurationMs}ms, exceeding 80% threshold of interval (${this.interval}ms)`
        );
      }
    } catch (err: any) {
      this.lastDurationMs = Date.now() - start;
      this.logger?.error?.(`[BaseDaemon:${this.name}] Unhandled exception in execution cycle: ${err?.message || err}`);
    }
  }
}
