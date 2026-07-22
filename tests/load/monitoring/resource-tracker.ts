/**
 * Resource Tracker Class
 * Analyzes logs to spot memory leaks and connection growth trends.
 */
export class ResourceTracker {
  public analyzeUsage(logs: any[]): { hasLeak: boolean; bottleneckDetected: boolean } {
    if (logs.length < 2) {
      return { hasLeak: false, bottleneckDetected: false };
    }

    const first = logs[0];
    const last = logs[logs.length - 1];

    // Detect leak if memory keeps growing
    const hasLeak = last.memoryUsageRatio - first.memoryUsageRatio > 0.15;
    const bottleneckDetected = last.cpuLoad > 0.90;

    return { hasLeak, bottleneckDetected };
  }
}
