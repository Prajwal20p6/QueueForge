import { DependencyStatus } from './dependency-checker';

export interface HealthAnalysis {
  score: number; // 0 - 100
  severity: 'healthy' | 'degraded' | 'unhealthy';
  summary: string;
  details: Record<string, any>;
}

function isHealthy(c: any): boolean {
  if (!c) return false;
  if (typeof c === 'string') return c.toUpperCase() === 'HEALTHY';
  return c.healthy === true;
}

function getLatency(c: any): number {
  if (c && typeof c.latencyMs === 'number') return c.latencyMs;
  return 0;
}

/**
 * Health analyzer computing weighted composite health scores and classification severities.
 */
export class HealthAnalyzer {
  constructor(private readonly logger?: any) {}

  /**
   * Computes health score, severity classification, and system status analysis.
   */
  public analyze(checks: DependencyStatus): HealthAnalysis {
    const score = this.calculateScore(checks);
    const severity = this.determineSeverity(score, checks);
    const summary = `System health score: ${score}/100 (${severity.toUpperCase()})`;

    this.logger?.debug?.(`[HealthAnalyzer] Analyzed status: score=${score}, severity=${severity}`);

    return {
      score,
      severity,
      summary,
      details: {
        database: checks.database,
        redis: checks.redis,
        queue: checks.queue,
      },
    };
  }

  /**
   * Calculates weighted score from 0 to 100 based on dependency health checks and roundtrip latency bounds.
   */
  public calculateScore(checks: DependencyStatus): number {
    let score = 0;

    // Database is worth 35 points
    if (isHealthy(checks?.database)) {
      score += 35;
      if (getLatency(checks.database) > 500) score -= 10;
    }

    // Redis is worth 35 points
    if (isHealthy(checks?.redis)) {
      score += 35;
      if (getLatency(checks.redis) > 200) score -= 10;
    }

    // Queue is worth 30 points
    if (isHealthy(checks?.queue)) {
      score += 30;
      if (getLatency(checks.queue) > 300) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determines severity label ('healthy', 'degraded', 'unhealthy') from score or checks state.
   */
  public determineSeverity(scoreOrAnalysis: number | HealthAnalysis, checks?: DependencyStatus): 'healthy' | 'degraded' | 'unhealthy' {
    const score = typeof scoreOrAnalysis === 'number' ? scoreOrAnalysis : scoreOrAnalysis.score;

    if (checks) {
      const failedCount = [checks.database, checks.redis, checks.queue].filter(c => !isHealthy(c)).length;
      if (failedCount >= 2) return 'unhealthy';
      if (failedCount === 1) return 'degraded';
    }

    if (score >= 90) return 'healthy';
    if (score >= 50) return 'degraded';
    return 'unhealthy';
  }
}
