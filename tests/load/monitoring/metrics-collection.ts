import * as os from 'os';

/**
 * Periodically collects system resource metrics during load tests.
 */
export class MetricsCollector {
  private intervalId: NodeJS.Timeout | null = null;
  private logs: any[] = [];

  public start(intervalMs = 10000): void {
    this.intervalId = setInterval(() => {
      const freeMem = os.freemem();
      const totalMem = os.totalmem();
      this.logs.push({
        timestamp: new Date().toISOString(),
        cpuLoad: os.loadavg()[0],
        memoryUsageRatio: (totalMem - freeMem) / totalMem,
      });
    }, intervalMs);
  }

  public stop(): any[] {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    return this.logs;
  }
}
