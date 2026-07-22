export interface SLOConfig {
  availabilityTarget?: number; // e.g., 99.9 (%)
  latencyP95TargetMs?: number; // e.g., 5000 (ms)
  errorRateTarget?: number; // e.g., 0.05 (%)
}

export interface SLOStatus {
  met: boolean;
  budget: number;
  burndown: number;
}

export interface SLOReport {
  availability: number;
  latencyP95: number;
  errorRate: number;
  status: SLOStatus;
}

/**
 * SLOTracker tracks availability %, P95 latencies, error budgets, and burndown rates.
 */
export class SLOTracker {
  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private readonly latencies: number[] = [];
  public readonly availabilityTarget: number;
  public readonly latencyP95TargetMs: number;
  public readonly errorRateTarget: number;

  constructor(
    _metricsRegistry?: any,
    config: SLOConfig = {}
  ) {
    this.availabilityTarget = config.availabilityTarget ?? 99.9;
    this.latencyP95TargetMs = config.latencyP95TargetMs ?? 5000;
    this.errorRateTarget = config.errorRateTarget ?? 0.05;
  }

  public trackAvailability(success: boolean): void {
    this.totalRequests++;
    if (success) {
      this.successfulRequests++;
    } else {
      this.failedRequests++;
    }
  }

  public trackLatency(latencyMs: number): void {
    this.latencies.push(latencyMs);
    if (this.latencies.length > 1000) {
      this.latencies.shift();
    }
  }

  public trackErrorRate(success: boolean): void {
    this.trackAvailability(success);
  }

  public getStatus(): SLOStatus {
    const total = this.totalRequests || 1;
    const availabilityPct = (this.successfulRequests / total) * 100;
    const allowedFailureRate = 100 - this.availabilityTarget;
    const actualFailureRate = (this.failedRequests / total) * 100;

    const budget = Math.max(0, allowedFailureRate - actualFailureRate);
    const burndown = allowedFailureRate > 0 ? (actualFailureRate / allowedFailureRate) * 100 : 0;
    const met = availabilityPct >= this.availabilityTarget;

    return {
      met,
      budget,
      burndown,
    };
  }

  public getSLOReport(): SLOReport {
    const total = this.totalRequests || 1;
    const availability = (this.successfulRequests / total) * 100;
    const errorRate = (this.failedRequests / total) * 100;

    let latencyP95 = 0;
    if (this.latencies.length > 0) {
      const sorted = [...this.latencies].sort((a, b) => a - b);
      const index = Math.floor(sorted.length * 0.95);
      latencyP95 = sorted[Math.min(index, sorted.length - 1)];
    }

    return {
      availability,
      latencyP95,
      errorRate,
      status: this.getStatus(),
    };
  }
}
